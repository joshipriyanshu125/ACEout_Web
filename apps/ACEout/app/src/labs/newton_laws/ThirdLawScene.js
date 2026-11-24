import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font } from '../../theme';
import { stepRocket, stepCollidingCarts, stepSwimmer, FIXED_DT } from './physics';

class SceneBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ThirdLawScene 3D error:', error, info);
  }
  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// -----------------------------------------------------------------------------
// 3D SCENARIO A: ROCKET WITH EXHAUST PARTICLES & ACTION/REACTION ARROWS
// -----------------------------------------------------------------------------

function RocketMesh({ simRef, onFinish }) {
  const groupRef = useRef();
  const flameParticles = useRef([]);
  const reportedRef = useRef(false);

  useFrame(() => {
    if (!simRef?.current || !groupRef.current) return;
    const sim = simRef.current;

    if (sim.isRunning && sim.scenario === 'rocket') {
      const next = stepRocket({
        ...sim.rocket,
        dryMass: 5.0,
        fuelMass: sim.rocket.remainingFuel,
        isFiring: sim.rocket.isBurning,
        dt: FIXED_DT,
      });
      sim.rocket = next;

      if ((next.altitude > 8.0 || next.remainingFuel <= 0) && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onFinish?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { altitude, isBurning } = sim.rocket;
    groupRef.current.position.y = altitude;

    flameParticles.current.forEach((p, idx) => {
      if (!p) return;
      if (isBurning) {
        p.position.y -= 0.08 + (idx % 3) * 0.03;
        p.scale.setScalar(Math.max(0.01, p.scale.x - 0.02));
        if (p.position.y < -1.8) {
          p.position.set((Math.random() - 0.5) * 0.15, -0.6, (Math.random() - 0.5) * 0.15);
          p.scale.setScalar(0.25 + Math.random() * 0.15);
        }
      } else {
        p.scale.setScalar(0.001);
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Rocket Body */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.4, 24]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.3} />
      </mesh>

      {/* Nose Cone */}
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.25, 0.6, 24]} />
        <meshStandardMaterial color="#E0543F" metalness={0.3} roughness={0.3} />
      </mesh>

      {/* Fins */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
        <group key={idx} rotation={[0, angle, 0]} position={[0, 0.4, 0]}>
          <mesh position={[0.32, 0, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.04]} />
            <meshStandardMaterial color="#3257B0" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Nozzle */}
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.22, 0.25, 20]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Flame Particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (flameParticles.current[i] = el)}
          position={[(Math.random() - 0.5) * 0.15, -0.6 - (i * 0.08), (Math.random() - 0.5) * 0.15]}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#FFA500' : '#FF4500'} />
        </mesh>
      ))}

      {/* Upward Reaction Force Arrow (Thrust on Rocket) */}
      <group position={[0.5, 1.0, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
          <meshStandardMaterial color="#2FA87A" />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <coneGeometry args={[0.12, 0.3, 16]} />
          <meshStandardMaterial color="#2FA87A" />
        </mesh>
      </group>

      {/* Downward Action Force Arrow (Gas expulsion) */}
      <group position={[0.5, -0.2, 0]}>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
          <meshStandardMaterial color="#E0543F" />
        </mesh>
        <mesh position={[0, -1.0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.12, 0.3, 16]} />
          <meshStandardMaterial color="#E0543F" />
        </mesh>
      </group>
    </group>
  );
}

function LaunchPlatform() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[2.5, 2.7, 0.2, 32]} />
        <meshStandardMaterial color="#6E7684" roughness={0.6} />
      </mesh>
      <mesh position={[-1.0, 1.6, 0]}>
        <boxGeometry args={[0.2, 3.4, 0.2]} />
        <meshStandardMaterial color="#C53030" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.6, 2.2, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshStandardMaterial color="#718096" metalness={0.5} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// 3D SCENARIO B: TWO COLLIDING CARTS WITH CONTACT SENSORS
// -----------------------------------------------------------------------------

function CollidingCarts({ simRef, onFinish }) {
  const cart1Ref = useRef();
  const cart2Ref = useRef();
  const force1Arrow = useRef();
  const force2Arrow = useRef();
  const reportedRef = useRef(false);

  useFrame(() => {
    if (!simRef?.current) return;
    const sim = simRef.current;

    if (sim.isRunning && sim.scenario === 'collision') {
      const next = stepCollidingCarts({
        ...sim.carts,
        dt: FIXED_DT,
      });
      sim.carts = next;

      if ((next.x1 < -5.0 || next.x2 > 5.0) && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onFinish?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { x1, x2, inContact, fContact } = sim.carts;
    if (cart1Ref.current) cart1Ref.current.position.x = x1;
    if (cart2Ref.current) cart2Ref.current.position.x = x2;

    const contactScale = inContact ? Math.min(2.0, 0.5 + fContact * 0.03) : 0.001;
    if (force1Arrow.current) force1Arrow.current.scale.set(contactScale, 1, 1);
    if (force2Arrow.current) force2Arrow.current.scale.set(contactScale, 1, 1);
  });

  return (
    <group position={[0, 0.2, 0]}>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[11, 0.1, 1.2]} />
        <meshStandardMaterial color="#D8DDE6" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Cart 1 (Blue) */}
      <group ref={cart1Ref} position={[-2.5, 0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.9, 0.22, 0.6]} />
          <meshStandardMaterial color="#3257B0" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0.48, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.15, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#F7C95C" metalness={0.7} />
        </mesh>
        <group ref={force1Arrow} position={[-0.5, 0.45, 0]} scale={[0.001, 1, 1]}>
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
            <meshStandardMaterial color="#E0543F" />
          </mesh>
          <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.2, 16]} />
            <meshStandardMaterial color="#E0543F" />
          </mesh>
        </group>
      </group>

      {/* Cart 2 (Orange) */}
      <group ref={cart2Ref} position={[2.5, 0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.9, 0.22, 0.6]} />
          <meshStandardMaterial color="#E0543F" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[-0.48, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.15, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#F7C95C" metalness={0.7} />
        </mesh>
        <group ref={force2Arrow} position={[0.5, 0.45, 0]} scale={[0.001, 1, 1]}>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
            <meshStandardMaterial color="#2FA87A" />
          </mesh>
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.2, 16]} />
            <meshStandardMaterial color="#2FA87A" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// -----------------------------------------------------------------------------
// 3D SCENARIO C: SWIMMING MECHANICS
// -----------------------------------------------------------------------------

function SwimmingPool({ simRef, onFinish }) {
  const swimmerGroup = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const reportedRef = useRef(false);

  useFrame(() => {
    if (!simRef?.current) return;
    const sim = simRef.current;

    if (sim.isRunning && sim.scenario === 'swimming') {
      const next = stepSwimmer({
        ...sim.swimmer,
        dt: FIXED_DT,
      });
      sim.swimmer = next;

      if (next.x > 8.0 && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onFinish?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { x, strokePhase } = sim.swimmer;
    if (swimmerGroup.current) {
      swimmerGroup.current.position.x = -4.0 + (x % 9.0);
    }
    if (leftArm.current) {
      leftArm.current.rotation.z = Math.sin(strokePhase) * 0.8;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = -Math.sin(strokePhase) * 0.8;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Pool Basin */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[11, 0.7, 2.2]} />
        <meshStandardMaterial color="#1E3A8A" roughness={0.3} />
      </mesh>

      {/* Water Surface using transparent meshStandardMaterial (safe and robust) */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[10.6, 0.05, 2.0]} />
        <meshStandardMaterial
          color="#38BDF8"
          transparent
          opacity={0.45}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Lane Markers */}
      <mesh position={[0, 0.02, 0.95]}>
        <cylinderGeometry args={[0.04, 0.04, 10.6, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      <mesh position={[0, 0.02, -0.95]}>
        <cylinderGeometry args={[0.04, 0.04, 10.6, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>

      {/* Swimmer Model */}
      <group ref={swimmerGroup} position={[-4, 0, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.8, 0.15, 0.35]} />
          <meshStandardMaterial color="#E2A177" roughness={0.5} />
        </mesh>
        <mesh position={[0.48, 0.05, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#2563EB" />
        </mesh>
        <mesh ref={leftArm} position={[0.2, 0.02, 0.24]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial color="#E2A177" />
        </mesh>
        <mesh ref={rightArm} position={[0.2, 0.02, -0.24]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial color="#E2A177" />
        </mesh>

        {/* Backward Action Arrow on Water */}
        <group position={[-0.6, 0.25, 0]}>
          <mesh position={[-0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 16]} />
            <meshStandardMaterial color="#E0543F" />
          </mesh>
          <mesh position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.09, 0.18, 16]} />
            <meshStandardMaterial color="#E0543F" />
          </mesh>
        </group>

        {/* Forward Reaction Arrow on Swimmer */}
        <group position={[0.7, 0.25, 0]}>
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 16]} />
            <meshStandardMaterial color="#2FA87A" />
          </mesh>
          <mesh position={[0.52, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.09, 0.18, 16]} />
            <meshStandardMaterial color="#2FA87A" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function CameraRig({ orbit, scenario }) {
  const { camera } = useThree();
  const target = useMemo(() => {
    if (scenario === 'rocket') return new THREE.Vector3(0, 1.4, 0);
    return new THREE.Vector3(0, 0.3, 0);
  }, [scenario]);

  useFrame(() => {
    const { az, el, dist } = orbit;
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el) + 0.1,
      target.z + dist * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(target);
  });

  return null;
}

export default function ThirdLawScene({
  scenario = 'rocket',
  simRef,
  onFinish,
  height = 270,
}) {
  const defaultDist = scenario === 'rocket' ? 5.2 : 6.8;
  const [orbit, setOrbit] = useState({ az: 0.2, el: 0.22, dist: defaultDist });
  const orbitRef = useRef(orbit);
  orbitRef.current = orbit;
  const startRef = useRef({ az: 0, el: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        startRef.current = { az: orbitRef.current.az, el: orbitRef.current.el };
      },
      onPanResponderMove: (_, g) => {
        setOrbit((o) => ({
          ...o,
          az: clamp(startRef.current.az - g.dx * 0.005, -1.8, 1.8),
          el: clamp(startRef.current.el + g.dy * 0.004, -0.1, 1.2),
        }));
      },
    })
  ).current;

  const zoom = (delta) => setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 2.5, 12.0) }));
  const resetCam = () => setOrbit({ az: 0.2, el: 0.22, dist: defaultDist });

  return (
    <View style={[styles.stage, { height }]}>
      <SceneBoundary fallback={(err) => <Text style={styles.err}>3D Bench Error: {String(err)}</Text>}>
        <Canvas
          style={StyleSheet.absoluteFill}
          camera={{ fov: 42, near: 0.1, far: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <CameraRig orbit={orbit} scenario={scenario} />
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 7, 5]} intensity={1.9} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#C0D5FF" />

          {/* Base Bench */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[16, 0.2, 8]} />
            <meshStandardMaterial color="#EAE4D8" roughness={0.8} />
          </mesh>

          {scenario === 'rocket' ? (
            <group position={[0, 0, 0]}>
              <LaunchPlatform />
              <RocketMesh simRef={simRef} onFinish={onFinish} />
            </group>
          ) : scenario === 'collision' ? (
            <group position={[0, 0, 0]}>
              <CollidingCarts simRef={simRef} onFinish={onFinish} />
            </group>
          ) : (
            <group position={[0, 0, 0]}>
              <SwimmingPool simRef={simRef} onFinish={onFinish} />
            </group>
          )}
        </Canvas>
      </SceneBoundary>

      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {/* Vector Legend */}
      <View style={styles.vectorLegend} pointerEvents="none">
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#E0543F' }]} />
          <Text style={styles.legendText}>
            {scenario === 'rocket'
              ? 'Action: Exhaust Gas DOWN'
              : scenario === 'collision'
              ? 'F_21 (Force on Cart 1)'
              : 'Action: Water pushed BACK'}
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#2FA87A' }]} />
          <Text style={styles.legendText}>
            {scenario === 'rocket'
              ? 'Reaction: Rocket Thrust UP'
              : scenario === 'collision'
              ? 'F_12 (Force on Cart 2)'
              : 'Reaction: Swimmer propelled FWD'}
          </Text>
        </View>
      </View>

      {/* HUD Info */}
      <View style={styles.hudTopRight} pointerEvents="none">
        <Text style={styles.hudTitle}>NEWTON’S THIRD LAW</Text>
        <Text style={styles.hudSub}>F_action = -F_reaction (Equal & Opposite)</Text>
      </View>

      {/* Camera Controls */}
      <View style={styles.hudControls}>
        <Pressable style={styles.hudBtn} onPress={() => zoom(-0.6)}>
          <Text style={styles.hudBtnText}>＋</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={() => zoom(0.6)}>
          <Text style={styles.hudBtnText}>－</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={resetCam}>
          <Text style={styles.hudBtnText}>⟲</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: '#E7ECF3',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
  },
  err: {
    padding: 20,
    color: color.red,
    fontFamily: font.medium,
  },
  vectorLegend: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.hairline,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: color.ink,
  },
  hudTopRight: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'flex-end',
  },
  hudTitle: {
    fontFamily: font.displayBold,
    fontSize: 11,
    color: color.blueDeep,
  },
  hudSub: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkSoft,
    marginTop: 1,
  },
  hudControls: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  hudBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudBtnText: {
    fontFamily: font.bold,
    fontSize: 15,
    color: color.inkStrong,
  },
});
