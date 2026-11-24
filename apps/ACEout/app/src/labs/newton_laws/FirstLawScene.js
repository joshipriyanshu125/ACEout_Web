import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font } from '../../theme';
import { stepCoinCard, stepFirstLawCart, FIXED_DT } from './physics';

class SceneBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('FirstLawScene 3D error:', error, info);
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
// 3D SCENARIO A: COIN, CARD & GLASS
// -----------------------------------------------------------------------------

function GlassTumbler() {
  return (
    <group position={[0, 0.5, 0]}>
      {/* Outer transparent glass cylinder using robust meshStandardMaterial */}
      <mesh>
        <cylinderGeometry args={[0.55, 0.45, 1.0, 32, 1, true]} />
        <meshStandardMaterial
          color="#DCEEFF"
          transparent
          opacity={0.38}
          roughness={0.08}
          metalness={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glass base */}
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
        <meshStandardMaterial color="#B8D8F8" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Rim ring */}
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[0.55, 0.02, 16, 32]} />
        <meshStandardMaterial color="#B0D4F6" roughness={0.1} />
      </mesh>
    </group>
  );
}

function CardAndCoin({ simRef, onComplete }) {
  const cardMesh = useRef();
  const coinMesh = useRef();
  const reportedRef = useRef(false);

  useFrame(() => {
    if (!simRef?.current) return;
    const sim = simRef.current;

    if (sim.isRunning && sim.scenario === 'coin_glass') {
      const next = stepCoinCard({
        ...sim.coinCard,
        pullSpeed: sim.coinCard.pullSpeed,
        dt: FIXED_DT,
      });
      sim.coinCard = next;

      if ((next.coinInGlass || next.cardX > 3.5) && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onComplete?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { cardX, coinX, coinY } = sim.coinCard;
    if (cardMesh.current) {
      cardMesh.current.position.set(cardX, 1.02, 0);
    }
    if (coinMesh.current) {
      coinMesh.current.position.set(coinX, coinY, 0);
    }
  });

  return (
    <group>
      {/* Stiff Cardboard Sheet */}
      <mesh ref={cardMesh} position={[0, 1.02, 0]}>
        <boxGeometry args={[1.5, 0.03, 1.2]} />
        <meshStandardMaterial color="#D8B27C" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Heavy Gold Coin */}
      <mesh ref={coinMesh} position={[0, 1.07, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
        <meshStandardMaterial color="#F4B41A" metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// 3D SCENARIO B: MOVING CART ON FRICTION TRACK
// -----------------------------------------------------------------------------

function FrictionTrack({ frictionCoeff = 0 }) {
  const surfaceColor = useMemo(() => {
    if (frictionCoeff === 0) return '#CBE5F8';
    if (frictionCoeff < 0.2) return '#DCD3C1';
    return '#8A867E';
  }, [frictionCoeff]);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[11.0, 0.1, 1.4]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.4} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.06, 0.65]}>
        <boxGeometry args={[11.0, 0.12, 0.06]} />
        <meshStandardMaterial color="#6E7684" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.06, -0.65]}>
        <boxGeometry args={[11.0, 0.12, 0.06]} />
        <meshStandardMaterial color="#6E7684" metalness={0.6} roughness={0.3} />
      </mesh>

      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={i} position={[-5.0 + i * 1.0, 0.01, 0]}>
          <boxGeometry args={[0.04, 0.02, 1.2]} />
          <meshBasicMaterial color="#4A453E" />
        </mesh>
      ))}
    </group>
  );
}

function CartMesh({ simRef, onComplete, cartColor = '#4B7BE5' }) {
  const groupRef = useRef();
  const wheelRefs = useRef([]);
  const reportedRef = useRef(false);

  useFrame(() => {
    if (!simRef?.current || !groupRef.current) return;
    const sim = simRef.current;

    if (sim.isRunning && sim.scenario === 'moving_cart') {
      const next = stepFirstLawCart({
        ...sim.cart,
        dt: FIXED_DT,
      });
      sim.cart = next;

      if (next.v === 0 && sim.cart.x > 0.05 && !reportedRef.current) {
        reportedRef.current = true;
        sim.isRunning = false;
        onComplete?.(next);
      }
    } else {
      reportedRef.current = false;
    }

    const { x } = sim.cart;
    groupRef.current.position.x = -4.5 + x;

    const angle = x / 0.15;
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.z = -angle;
    });
  });

  return (
    <group ref={groupRef} position={[-4.5, 0.22, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.0, 0.22, 0.7]} />
        <meshStandardMaterial color={cartColor} metalness={0.4} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.5]} />
        <meshStandardMaterial color="#F7C95C" roughness={0.5} />
      </mesh>

      {[
        [-0.35, 0, 0.38],
        [0.35, 0, 0.38],
        [-0.35, 0, -0.38],
        [0.35, 0, -0.38],
      ].map((pos, idx) => (
        <mesh
          key={idx}
          ref={(el) => (wheelRefs.current[idx] = el)}
          position={pos}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.14, 0.14, 0.08, 20]} />
          <meshStandardMaterial color="#222224" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ orbit, scenario }) {
  const { camera } = useThree();
  const target = useMemo(() => {
    if (scenario === 'coin_glass') {
      return new THREE.Vector3(0, 0.6, 0);
    }
    return new THREE.Vector3(0, 0.4, 0);
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

export default function FirstLawScene({
  scenario = 'coin_glass',
  simRef,
  onComplete,
  hudNote = '',
  frictionCoeff = 0,
  height = 270,
}) {
  const defaultDist = scenario === 'coin_glass' ? 2.8 : 5.8;
  const [orbit, setOrbit] = useState({ az: 0.25, el: 0.22, dist: defaultDist });
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
          az: clamp(startRef.current.az - g.dx * 0.006, -1.8, 1.8),
          el: clamp(startRef.current.el + g.dy * 0.005, -0.1, 1.2),
        }));
      },
    })
  ).current;

  const zoom = (delta) => setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 1.5, 9.0) }));
  const resetCam = () => setOrbit({ az: 0.25, el: 0.22, dist: defaultDist });

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
          <directionalLight position={[3, 5, 4]} intensity={1.8} castShadow />
          <directionalLight position={[-3, 2, -3]} intensity={0.6} color="#B0D0FF" />

          {/* Table Surface */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[14, 0.2, 8]} />
            <meshStandardMaterial color="#EAE3D5" roughness={0.8} />
          </mesh>

          {scenario === 'coin_glass' ? (
            <group position={[0, 0, 0]}>
              <GlassTumbler />
              <CardAndCoin simRef={simRef} onComplete={onComplete} />
            </group>
          ) : (
            <group position={[0, 0, 0]}>
              <FrictionTrack frictionCoeff={frictionCoeff} />
              <CartMesh simRef={simRef} onComplete={onComplete} />
            </group>
          )}
        </Canvas>
      </SceneBoundary>

      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {/* HUD Info Overlay */}
      <View style={styles.hudTopLeft} pointerEvents="none">
        <Text style={styles.hudTitle}>
          {scenario === 'coin_glass'
            ? 'EXPERIMENT 1A: COIN, CARD & GLASS'
            : 'EXPERIMENT 1B: MOVING CART ON TRACK'}
        </Text>
        <Text style={styles.hudSub}>{hudNote}</Text>
      </View>

      {/* Camera Navigation Controls */}
      <View style={styles.hudControls}>
        <Pressable style={styles.hudBtn} onPress={() => zoom(-0.5)}>
          <Text style={styles.hudBtnText}>＋</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={() => zoom(0.5)}>
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
    backgroundColor: '#E6EBF2',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
  },
  err: {
    padding: 20,
    color: color.red,
    fontFamily: font.medium,
  },
  hudTopLeft: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  hudTitle: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.ink,
    letterSpacing: 0.5,
  },
  hudSub: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.blueDeep,
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
