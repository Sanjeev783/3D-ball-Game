/**
 * PhysicsWorld.js
 * Cannon-es physics engine wrapper with high-precision substepping,
 * realistic contact materials (metal-on-concrete & metal-on-steel),
 * continuous contact manifold inspection, and collision callback dispatch.
 */

import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -18.5, 0) // Heavy, realistic earth gravity
    });

    // Solver configuration for maximum stability and no wall penetration
    this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;
    this.world.solver.iterations = 12;

    // Materials
    this.ballMaterial = new CANNON.Material('ball');
    this.wallMaterial = new CANNON.Material('wall');
    this.floorMaterial = new CANNON.Material('floor');
    this.rampMaterial = new CANNON.Material('ramp');
    this.ceilingMaterial = new CANNON.Material('ceiling');

    // Contact rules: Metal Ball vs Concrete/Steel Wall
    // Setting friction to 0.0 prevents the rolling ball from grabbing vertical surfaces,
    // sticking, climbing walls, or generating asymmetric torque that magnetizes the ball to one direction.
    const ballWallContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.wallMaterial,
      {
        friction: 0.0,
        restitution: 0.02,
        contactEquationStiffness: 5e7,
        contactEquationRelaxation: 8.0 // Smooth energy absorption
      }
    );
    this.world.addContactMaterial(ballWallContact);

    // Ball vs Invisible Ceiling (stops flying ball with clean downward deflection)
    const ballCeilingContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.ceilingMaterial,
      {
        friction: 0.05,
        restitution: 0.0,
        contactEquationStiffness: 5e7,
        contactEquationRelaxation: 6.0
      }
    );
    this.world.addContactMaterial(ballCeilingContact);

    // Ball vs Floor
    const ballFloorContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.floorMaterial,
      {
        friction: 0.45,
        restitution: 0.01,
        contactEquationStiffness: 6e7,
        contactEquationRelaxation: 6.0
      }
    );
    this.world.addContactMaterial(ballFloorContact);

    // Ball vs Metal Ramp
    const ballRampContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.rampMaterial,
      {
        friction: 0.35,
        restitution: 0.01,
        contactEquationStiffness: 4e7,
        contactEquationRelaxation: 7.0
      }
    );
    this.world.addContactMaterial(ballRampContact);

    this.impactListeners = [];
    this.bodies = [];
  }

  /**
   * Adds an impact listener callback for metal collision effects & audio
   */
  onImpact(callback) {
    this.impactListeners.push(callback);
  }

  /**
   * Binds collision detection to the player's ball body
   */
  setupBallCollisionListener(ballBody) {
    ballBody.addEventListener('collide', (event) => {
      const contact = event.contact;
      if (!contact) return;

      const isBodyI = contact.bi === ballBody;
      const otherBody = isBodyI ? contact.bj : contact.bi;
      const surfaceType = otherBody.userData?.surfaceType || otherBody.material?.name || 'wall';

      // Reduce collision speed bump & eliminate wall hop:
      // When colliding with a wall, immediately suppress upward vertical impulses
      // so the ball doesn't pop into the air or behave like it hit a speed bump
      if (surfaceType === 'wall') {
        if (ballBody.velocity.y > 0.2) {
          ballBody.velocity.y = 0.05;
        }
      } else if (surfaceType === 'ceiling') {
        if (ballBody.velocity.y > 0) {
          ballBody.velocity.y = -0.4;
        }
      }

      const impactVelocity = Math.abs(contact.getImpactVelocityAlongNormal());
      // Filter out low-energy rolling tremors and wall brushes (< 1.2 m/s)
      if (impactVelocity < 1.2) return;

      // Calculate world contact point
      const r = isBodyI ? contact.ri : contact.rj;
      const contactPoint = new CANNON.Vec3();
      contact.bi.position.vadd(contact.ri, contactPoint);

      // Contact normal pointing away from the wall toward the ball
      const normal = new CANNON.Vec3();
      if (isBodyI) {
        normal.copy(contact.ni).negate();
      } else {
        normal.copy(contact.ni);
      }

      const impactData = {
        point: { x: contactPoint.x, y: contactPoint.y, z: contactPoint.z },
        normal: { x: normal.x, y: normal.y, z: normal.z },
        velocity: impactVelocity,
        impactForce: impactVelocity * ballBody.mass,
        surfaceType: surfaceType
      };

      for (const listener of this.impactListeners) {
        listener(impactData);
      }

      // Smooth velocity clamping: prevent uncontrolled fling without jarring stops
      const vel = ballBody.velocity;
      const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      const MAX_SPEED = 14.0;
      if (currentSpeed > MAX_SPEED) {
        const scale = MAX_SPEED / currentSpeed;
        ballBody.velocity.set(vel.x * scale, vel.y * scale, vel.z * scale);
      }
    });
  }

  /**
   * Add a body to the world
   */
  addBody(body) {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  /**
   * Advance physics with sub-stepping for zero tunneling
   */
  step(deltaTime) {
    // Fixed timestep of 1/120s with up to 10 sub-steps to guarantee no tunneling
    const fixedTimeStep = 1 / 120;
    const maxSubSteps = 10;
    this.world.step(fixedTimeStep, Math.min(deltaTime, 0.1), maxSubSteps);
  }

  /**
   * Cleans up all bodies
   */
  clear() {
    for (const b of this.bodies) {
      this.world.removeBody(b);
    }
    this.bodies = [];
  }
}
