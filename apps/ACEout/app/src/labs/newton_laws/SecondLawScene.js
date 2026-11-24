import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font } from '../../theme';
import { stepSecondLaw, FIXED_DT } from './physics';

class SceneBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('SecondLawScene 3D error:', error, info);
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
// 3D FORCE ARROW COMPONENT
// -----------------------------------------------------------------------------

function ForceArrow({ position = [0, 0, 0], direction = 1, magnitude = 10, maxMag = 100, colorHex = '#2FA87A' }) {
  if (magnitude <= 0.1) return null;
  const length = 0.3 + (magnitude / maxMag) * 2.0;
  const arrowDir = direction >= 0 ? 1 : -1;
  const shaftLength = Math.max(0.1, length - 0.35);

  return (
    <group position={position}>
      <mesh position={[arrowDir * (shaftLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, shaftLength, 16]} />
        <meshStandardMaterial color={colorHex} metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh
        position={[arrowDir * (shaftLength + 0.16), 0, 0]}
        rotation={[0, 0, arrowDir > 0 ? -Math.PI / 2 : Math.PI / 2]}
      >
        <coneGeometry args={[0.12, 0.32, 16]} />
        <meshStandardMaterial color={colorHex} metalness={0.2} roughness={0.3} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// 3D CART WITH DYNAMIC MASS WEIGHTS & FORCE ARROWS
// -----------------------------------------------------------------------------

function SecondLawCart({ simRef, onFinish, mass, appliedForce, frictionForce, netForce }) {
  const groupRef = useRef();
  const wheelRefs = useRef([]);
  const reportedRef = useRef(false);

  const weightCount = useMemo(() => {
    if (mass <= 2) return 1;
    if (mass <= 5) return 2;
    if (mass <= 10) return 3;
    if (mass <= 15) return 4;
    return 5;
  }, [mass]);

  useFrame(() => {
    if (!simRef?.current || !groupRef.current) return;
    const sim = simRef.current;

    if (sim.isRunning) {
      const next = stepSecondLaw({
        ...sim.state,
        mass,
        appliedForce,
        frictionForce,
        dt: FIXED_DT,
      });
      sim.state = next;

      if (next.finished && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onFinish?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { x } = sim.state;
    groupRef.current.position.x = -5.5 + x;

    const rot = x / 0.16;
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.z = -rot;
    });
  });

  return (
    <group ref={groupRef} position={[-5.5, 0.22, 0]}>
      {/* Cart Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.8]} />
        <meshStandardMaterial color="#3257B0" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Stacked Mass Weight Plates */}
      {Array.from({ length: weightCount }).map((_, i) => (
        <mesh key={i} position={[0, 0.24 + i * 0.1, 0]}>
          <boxGeometry args={[0.85, 0.08, 0.6]} />
          <meshStandardMaterial color="#6E7684" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Wheels */}
      {[
        [-0.45, 0, 0.45],
        [0.45, 0, 0.45],
        [-0.45, 0, -0.45],
        [0.45, 0, -0.45],
      ].map((pos, idx) => (
        <mesh
          key={idx}
          ref={(el) => (wheelRefs.current[idx] = el)}
          position={pos}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.09, 20]} />
          <meshStandardMaterial color="#1E1E20" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}

      {/* Applied Force Vector (Green) */}
      <ForceArrow
        position={[0.65, 0.1, 0.5]}
        direction={1}
        magnitude={appliedForce}
        maxMag={100}
        colorHex="#2FA87A"
      />

      {/* Friction Vector (Red) */}
      <ForceArrow
        position={[-0.65, 0.1, 0.5]}
        direction={-1}
        magnitude={frictionForce}
        maxMag={25}
        colorHex="#E0543F"
      />

      {/* Net Force Vector (Gold) */}
      {netForce > 0.1 ? (
        <ForceArrow
          position={[0, 0.75, 0]}
          direction={1}
          magnitude={netForce}
          maxMag={100}
          colorHex="#E8A83A"
        />
      ) : null}
    </group>
  );
}

function LongTrack() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[13.5, 0.12, 1.3]} />
        <meshStandardMaterial color="#D8DDE6" metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.05, 0.6]}>
        <boxGeometry args={[13.5, 0.1, 0.06]} />
        <meshStandardMaterial color="#4A5568" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, -0.6]}>
        <boxGeometry args={[13.5, 0.1, 0.06]} />
        <meshStandardMaterial color="#4A5568" metalness={0.7} roughness={0.3} />
      </mesh>

      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[-6.0 + i * 1.0, 0.01, 0]}>
          <boxGeometry args={[0.04, 0.02, 1.1]} />
          <meshBasicMaterial color="#2D3748" />
        </mesh>
      ))}

      <mesh position={[-6.2, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.4, 1.2]} />
        <meshStandardMaterial color="#C53030" roughness={0.5} />
      </mesh>
      <mesh position={[6.2, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.4, 1.2]} />
        <meshStandardMaterial color="#C53030" roughness={0.5} />
      </mesh>
    </group>
  );
}

function CameraRig({ orbit }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);

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

export default function SecondLawScene({
  simRef,
  onFinish,
  mass = 2,
  appliedForce = 20,
  frictionForce = 0,
  netForce = 20,
  acceleration = 10,
  height = 270,
}) {
  const [orbit, setOrbit] = useState({ az: 0.18, el: 0.24, dist: 7.2 });
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

  const zoom = (delta) => setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 3.0, 14.0) }));
  const resetCam = () => setOrbit({ az: 0.18, el: 0.24, dist: 7.2 });

  return (
    <View style={[styles.stage, { height }]}>
      <SceneBoundary fallback={(err) => <Text style={styles.err}>3D Bench Error: {String(err)}</Text>}>
        <Canvas
          style={StyleSheet.absoluteFill}
          camera={{ fov: 42, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <CameraRig orbit={orbit} />
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 7, 5]} intensity={1.9} castShadow />
          <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#C0D5FF" />

          {/* Table Surface */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[16, 0.2, 7]} />
            <meshStandardMaterial color="#EAE4D8" roughness={0.8} />
          </mesh>

          <LongTrack />
          <SecondLawCart
            simRef={simRef}
            onFinish={onFinish}
            mass={mass}
            appliedForce={appliedForce}
            frictionForce={frictionForce}
            netForce={netForce}
          />
        </Canvas>
      </SceneBoundary>

      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {/* Vector Legend */}
      <View style={styles.vectorLegend} pointerEvents="none">
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#2FA87A' }]} />
          <Text style={styles.legendText}>Applied Force (F = {appliedForce} N)</Text>
        </View>
        {frictionForce > 0 ? (
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#E0543F' }]} />
            <Text style={styles.legendText}>Friction (f = {frictionForce} N)</Text>
          </View>
        ) : null}
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#E8A83A' }]} />
          <Text style={styles.legendText}>Net Force (F_net = {netForce} N)</Text>
        </View>
      </View>

      {/* Live Acceleration Readout */}
      <View style={styles.hudTopRight} pointerEvents="none">
        <Text style={styles.hudAccValue}>a = {acceleration.toFixed(2)} m/s²</Text>
        <Text style={styles.hudSub}>F = m × a · Track Length: 12.0 m</Text>
      </View>

      {/* Camera Controls */}
      <View style={styles.hudControls}>
        <Pressable style={styles.hudBtn} onPress={() => zoom(-0.8)}>
          <Text style={styles.hudBtnText}>＋</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={() => zoom(0.8)}>
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
    gap: 3,
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
  hudAccValue: {
    fontFamily: font.displayBold,
    fontSize: 14,
    color: color.blueDeep,
  },
  hudSub: {
    fontFamily: font.medium,
    fontSize: 10,
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
