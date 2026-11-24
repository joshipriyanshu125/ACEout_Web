/**
 * Newton's Three Laws of Motion - Physics Engine
 * 
 * Numerical calculations, differential equations, and simulation physics for:
 * 1. Law of Inertia (First Law): Inertia of rest (coin & card) and motion (friction track).
 * 2. Law of Acceleration (Second Law): F_net = m * a, with numerical integration.
 * 3. Action and Reaction (Third Law): Rocket propulsion, cart collision momentum & impulse, swimming mechanics.
 */

// Fixed or clamped time step for deterministic, stable integration
export const FIXED_DT = 1 / 60;

/**
 * ---------------------------------------------------------------------------
 * EXPERIMENT 1: FIRST LAW (INERTIA)
 * ---------------------------------------------------------------------------
 */

/**
 * Simulates card and coin dynamics.
 * When the card is pulled with high impulse (fast pull), card acceleration >> static friction limit.
 * The card quickly slips out from underneath the coin (inertia of rest).
 * The coin remains horizontally undisturbed, then falls vertically into the tumbler under gravity.
 *
 * If pulled slowly (low pull speed), static friction between card and coin is sufficient to carry
 * the coin along horizontally with the card.
 */
export function stepCoinCard({
  cardX = 0,
  cardVx = 0,
  coinX = 0,
  coinY = 1.0, // Initial height on top of card
  coinVx = 0,
  coinVy = 0,
  isPulled = false,
  pullSpeed = 'fast', // 'fast' | 'slow'
  cardWidth = 1.2,
  glassRadius = 0.5,
  glassHeight = 1.0,
  dt = FIXED_DT,
}) {
  let nextCardX = cardX;
  let nextCardVx = cardVx;
  let nextCoinX = coinX;
  let nextCoinY = coinY;
  let nextCoinVx = coinVx;
  let nextCoinVy = coinVy;
  let cardCleared = false;
  let coinInGlass = false;
  let stateNote = 'At Rest';

  const g = 9.8;
  const staticFrictionMaxAcc = 2.2; // max acceleration static friction can provide to coin

  if (isPulled) {
    if (pullSpeed === 'fast') {
      // Rapid card pull: large card acceleration (e.g. 24 m/s^2)
      nextCardVx += 24.0 * dt;
      nextCardX += nextCardVx * dt;

      // Card slips out rapidly. Kinetic friction transfers slight horizontal acceleration
      const kineticFrictionAcc = 0.5;
      if (nextCardX < cardWidth) {
        nextCoinVx += kineticFrictionAcc * dt;
      }
      nextCoinX += nextCoinVx * dt;

      // Once card moves past coin, coin loses vertical support and enters free fall
      const cardEdge = nextCardX - cardWidth / 2;
      if (cardEdge > nextCoinX || nextCardX > 0.4) {
        cardCleared = true;
        nextCoinVy -= g * dt;
        nextCoinY += nextCoinVy * dt;

        // Bottom of glass contact
        const bottomY = 0.08;
        if (nextCoinY <= bottomY) {
          nextCoinY = bottomY;
          nextCoinVy = 0;
          nextCoinVx = 0;
          coinInGlass = Math.abs(nextCoinX) < glassRadius;
        }
        stateNote = coinInGlass
          ? 'Coin landed in glass (Inertia of Rest demonstrated)'
          : 'Card accelerated out; Coin falling under gravity';
      } else {
        stateNote = 'Card slipping from beneath coin';
      }
    } else {
      // Slow card pull: card acceleration is gentle (e.g. 1.2 m/s^2 <= staticFrictionMaxAcc)
      nextCardVx += 1.2 * dt;
      nextCardX += nextCardVx * dt;

      // Coin moves along with the card because friction force is enough to accelerate the coin
      nextCoinX = nextCardX;
      nextCoinVx = nextCardVx;
      stateNote = 'Slow pull: Friction accelerates coin along with card';
    }
  }

  return {
    cardX: nextCardX,
    cardVx: nextCardVx,
    coinX: nextCoinX,
    coinY: Math.max(0.08, nextCoinY),
    coinVx: nextCoinVx,
    coinVy: nextCoinVy,
    cardCleared,
    coinInGlass,
    stateNote,
  };
}

/**
 * Simulates a cart moving along a straight track under friction.
 * If friction = 0, cart moves with uniform velocity indefinitely (inertia of motion).
 * If friction > 0, friction is the external unbalanced force causing deceleration.
 */
export function stepFirstLawCart({
  x = 0,
  v = 0,
  mass = 2.0,
  frictionCoeff = 0, // mu
  pushForce = 0,
  trackLength = 10.0,
  dt = FIXED_DT,
}) {
  const g = 9.8;
  const normalForce = mass * g;
  const frictionMagnitude = frictionCoeff * normalForce;

  let netForce = pushForce;
  let motionState = 'At Rest';

  if (v > 0.001) {
    // Friction opposes velocity
    netForce = pushForce - frictionMagnitude;
    motionState = frictionCoeff === 0 ? 'Uniform Motion (Zero Friction)' : 'Decelerating (Friction opposes motion)';
  } else if (v < -0.001) {
    netForce = pushForce + frictionMagnitude;
    motionState = 'Moving Backward';
  } else {
    // Cart is nearly stationary
    if (Math.abs(pushForce) > frictionMagnitude) {
      netForce = pushForce > 0 ? pushForce - frictionMagnitude : pushForce + frictionMagnitude;
      motionState = 'Accelerating under Unbalanced Force';
    } else {
      netForce = 0;
      motionState = 'At Rest (Balanced Forces)';
    }
  }

  const acceleration = netForce / mass;
  let nextV = v + acceleration * dt;

  // Handle stopping when friction brings cart to zero velocity
  if (v > 0 && nextV < 0 && pushForce === 0) {
    nextV = 0;
    motionState = 'Came to Rest (Friction dissipated kinetic energy)';
  }

  let nextX = x + nextV * dt;
  if (nextX > trackLength) {
    nextX = trackLength;
    nextV = 0;
    motionState = 'Reached End of Track';
  } else if (nextX < 0) {
    nextX = 0;
    nextV = 0;
  }

  return {
    x: nextX,
    v: Math.max(0, nextV),
    a: acceleration,
    netForce,
    frictionForce: frictionMagnitude,
    motionState,
  };
}

/**
 * ---------------------------------------------------------------------------
 * EXPERIMENT 2: SECOND LAW (F = m * a)
 * ---------------------------------------------------------------------------
 */

/**
 * Computes exact Newton's Second Law values:
 * Net Force = Applied Force - Friction
 * Acceleration = Net Force / Mass
 */
export function calculateSecondLaw({ mass, appliedForce, frictionForce = 0 }) {
  const m = Math.max(0.1, Number(mass) || 1);
  const F_app = Math.max(0, Number(appliedForce) || 0);
  const f_fric = Math.max(0, Number(frictionForce) || 0);

  // If applied force does not overcome friction, net force is zero and cart remains at rest
  const netForce = F_app > f_fric ? F_app - f_fric : 0;
  const acceleration = netForce / m;

  return {
    mass: m,
    appliedForce: F_app,
    frictionForce: f_fric,
    netForce: Number(netForce.toFixed(3)),
    acceleration: Number(acceleration.toFixed(3)),
  };
}

/**
 * Fixed time-step kinematics integration for Second Law cart.
 */
export function stepSecondLaw({
  x = 0,
  v = 0,
  mass = 2.0,
  appliedForce = 10.0,
  frictionForce = 0,
  time = 0,
  trackLength = 12.0,
  dt = FIXED_DT,
}) {
  const { netForce, acceleration } = calculateSecondLaw({ mass, appliedForce, frictionForce });

  const nextV = v + acceleration * dt;
  const nextX = x + nextV * dt;
  const nextTime = time + dt;
  const finished = nextX >= trackLength;

  return {
    x: Math.min(trackLength, nextX),
    v: nextV,
    a: acceleration,
    netForce,
    time: nextTime,
    finished,
  };
}

/**
 * ---------------------------------------------------------------------------
 * EXPERIMENT 3: THIRD LAW (ACTION & REACTION)
 * ---------------------------------------------------------------------------
 */

/**
 * Scenario A: Rocket Propulsion
 * Exhaust gases pushed downwards with velocity V_ex at mass burn rate dm/dt.
 * Action: F_action = (dm/dt) * V_ex downwards on exhaust gases.
 * Reaction: F_reaction = F_action upwards on rocket (Thrust).
 * Net force on rocket: F_net = F_thrust - (m_rocket * g).
 * Acceleration: a = F_net / m_rocket.
 */
export function stepRocket({
  altitude = 0,
  velocity = 0,
  dryMass = 5.0, // kg
  fuelMass = 5.0, // kg
  burnRate = 0.5, // kg/s
  exhaustSpeed = 280.0, // m/s
  isFiring = true,
  dt = FIXED_DT,
}) {
  const g = 9.8;
  let remainingFuel = fuelMass;
  let thrust = 0;
  let actionForce = 0;

  if (isFiring && remainingFuel > 0) {
    const fuelBurned = Math.min(remainingFuel, burnRate * dt);
    remainingFuel -= fuelBurned;
    // Action = rate of change of momentum of expelled gas
    actionForce = (fuelBurned / dt) * exhaustSpeed;
    thrust = actionForce;
  }

  const totalMass = dryMass + remainingFuel;
  const weight = totalMass * g;
  const netForce = thrust - weight;
  const acceleration = netForce / totalMass;

  let nextVelocity = velocity + acceleration * dt;
  let nextAltitude = altitude + nextVelocity * dt;

  if (nextAltitude <= 0) {
    nextAltitude = 0;
    nextVelocity = Math.max(0, nextVelocity);
  }

  return {
    altitude: nextAltitude,
    velocity: nextVelocity,
    acceleration,
    thrust,
    actionForce,
    reactionForce: thrust,
    totalMass,
    remainingFuel,
    isBurning: isFiring && remainingFuel > 0,
  };
}

/**
 * Scenario B: Two Colliding Carts
 * During contact: Cart 1 exerts force F_12 on Cart 2.
 * Cart 2 exerts equal and opposite force F_21 on Cart 1: F_21 = -F_12.
 * Conservation of linear momentum: m1 * v1 + m2 * v2 = m1 * v1' + m2 * v2'.
 */
export function stepCollidingCarts({
  x1 = -3.0,
  v1 = 2.0,
  m1 = 2.0,
  x2 = 3.0,
  v2 = -2.0,
  m2 = 2.0,
  cartWidth = 0.8,
  springConstant = 400.0, // Contact stiffness for action-reaction display
  damping = 10.0,
  dt = FIXED_DT,
}) {
  // Distance between cart centers
  const distance = x2 - x1;
  const contactDistance = cartWidth;
  const overlap = contactDistance - distance;

  let fContact = 0; // Magnitude of contact force
  let inContact = false;

  if (overlap > 0) {
    inContact = true;
    // Dynamic contact spring force
    const relativeVelocity = v1 - v2;
    fContact = Math.max(0, springConstant * overlap + damping * relativeVelocity);
  }

  // Force on Cart 1 from Cart 2 (pushes Cart 1 to the left)
  const forceOn1 = -fContact;
  // Force on Cart 2 from Cart 1 (pushes Cart 2 to the right: equal and opposite!)
  const forceOn2 = +fContact;

  const a1 = forceOn1 / m1;
  const a2 = forceOn2 / m2;

  const nextV1 = v1 + a1 * dt;
  const nextV2 = v2 + a2 * dt;

  const nextX1 = x1 + nextV1 * dt;
  const nextX2 = x2 + nextV2 * dt;

  // Audit total momentum
  const totalMomentum = m1 * nextV1 + m2 * nextV2;

  return {
    x1: nextX1,
    v1: nextV1,
    a1,
    m1,
    forceOn1, // Reaction: Cart 2 on Cart 1
    x2: nextX2,
    v2: nextV2,
    a2,
    m2,
    forceOn2, // Action: Cart 1 on Cart 2
    fContact,
    inContact,
    totalMomentum: Number(totalMomentum.toFixed(3)),
  };
}

/**
 * Scenario C: Swimming Mechanics
 * Swimmer pushes water backwards (Action).
 * Water pushes swimmer forwards with equal and opposite force (Reaction).
 */
export function stepSwimmer({
  x = 0,
  v = 0,
  swimmerMass = 60.0,
  strokePhase = 0, // 0 to 2pi
  strokeForceMagnitude = 180.0,
  waterDragCoeff = 24.0,
  isStroking = true,
  dt = FIXED_DT,
}) {
  let nextPhase = strokePhase;
  let actionForceWater = 0;
  let reactionForceSwimmer = 0;

  if (isStroking) {
    nextPhase = (strokePhase + 3.0 * dt) % (2 * Math.PI);
    // Stroke power peaks during the backward sweep
    const strokeFactor = Math.max(0, Math.sin(nextPhase));
    actionForceWater = strokeFactor * strokeForceMagnitude; // Force exerted backward on water
    reactionForceSwimmer = actionForceWater; // Forward propulsive reaction on swimmer
  }

  // Fluid drag: F_drag = C * v
  const dragForce = waterDragCoeff * v;
  const netForce = reactionForceSwimmer - dragForce;
  const acceleration = netForce / swimmerMass;

  let nextV = Math.max(0, v + acceleration * dt);
  let nextX = x + nextV * dt;

  return {
    x: nextX,
    v: nextV,
    a: acceleration,
    actionForce: actionForceWater, // Backward on water
    reactionForce: reactionForceSwimmer, // Forward on swimmer
    dragForce,
    strokePhase: nextPhase,
  };
}
