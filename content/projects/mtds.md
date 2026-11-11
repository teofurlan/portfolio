---
title: MTDS surgical robot arm
summary: A low-cost robot arm with a software remote center of motion, for laparoscopic training by teleoperation.
status: featured
order: 1
role: Kinematics and CAD lead (inverse kinematics, controller, Fusion 360 model)
team: 3
ownership: >-
  The Fusion 360 model and joint geometry, the closed-form inverse kinematics and
  the tool-space controller as C++ headers, and the analysis behind the 6-DOF redesign.
stack: [C++, ESP32, Arduino Mega, ESP-NOW, PlatformIO, Python, NumPy, JavaScript, Fusion 360]
tags: [hardware, robotics]
links:
  repo: https://github.com/teofurlan/mtds-brazo-robot
media: []
year: 2026
---

<!-- Sources: odd/evidence/mtds.md (explorer report of the mtds-brazo-robot repo:
CONTEXTO_PROYECTO.md, 02_rcm analysis sections, geom_mtds.h, ik_mtds.h, ctrl_mtds.h,
test_ik.cpp, test_ctrl.cpp, 03_simuladores.md). Order 1 (hardware leg first) is a draft choice.
Media candidates, not copied yet: 04_Produccion/Imagenes/modelo_3d_mtds.png (render);
Fotos_Hardware/Control Remoto - frente.jpg (check for people before use).
Demo video brazo_robot_demo.mp4 (552 MB): the repo says it is invalid as RCM evidence
(missing J4), do not use.
TODO(owner): repo visibility unverified; confirm it is public before linking.
TODO(owner): the CV and the repo disagree. The text below uses the repo-verified wording. Decide each:
  1. CV "validated against the CAD model to 3 micrometres": the 3 µm came from superseded geometry,
     and the repo says that check measured internal consistency, not CAD fidelity. Repo now: FK vs live CAD 0.003 mm;
     IK round-trip 0.0004 mm over 32k poses.
  2. CV "0.1% of the 50 Hz control loop": extrapolated. 0.383 µs measured on x86; the ESP32 figure assumes
     a 30-50x slowdown that was never measured on hardware.
  3. CV "structural fix, all four DOF, no extra motors": a proposal that was never built (adds a linear axis,
     removes J3), superseded on 2026-09-10 by a 6-DOF design with 6 motors.
  4. CV "five checks" for the unreachable RCM: the docs confirm the result, but the check scripts are not in the repo.
  5. CV "Fusion 360 automation via Python API": partial. Run through an MCP bridge to Fusion; scripts not in the repo.
TODO(owner): surgery congress (name and date): not found in the repo.
TODO(owner): which parts the two teammates built (unclear from the repo).
TODO(owner): the CV links a separate firmware repo (robot-arm) that was not inspected. -->

## Problem

University settings need a low-cost, reproducible robot arm for laparoscopic surgery training by teleoperation. Laparoscopic tools pivot about a fixed point at the incision, the remote center of motion (RCM). The client asked for that constraint to be held by software.

## Constraints

- Reuse hardware that was already bought: three NEMA17 motors, DRV8825 drivers, a RAMPS 1.6 board, a 12 V supply, an Arduino Mega, two ESP32 boards and servos.
- A tight deadline.
- A team of three.

## Decisions

- **Closed-form inverse kinematics in C++ headers**, with no iterative solver to tune or converge. Checked two ways: forward kinematics against the live CAD model to 0.003 mm, and an IK round-trip error of 0.0004 mm over 32k poses.
- **Tool-space resolved-rate control with damped least squares and an adaptive damping factor**, so the arm stays controllable near singularities. On x86 it takes 0.123 µs per cycle, with 0 joint-limit violations in 200k cycles. It was not measured on the ESP32.
- **Check feasibility before building.** The Jacobian has rank exactly 2 over 3000 poses, so the RCM cannot be held in software with this arm. The best pseudo-RCM had a median error of 101 mm (219 mm over the full range).
- **Move on after the negative result.** A structural fix was proposed (add a linear axis, remove joint 3), but it was never built. It was superseded on 2026-09-10 by a 6-DOF software-RCM design with six motors.
- **A browser 3D simulator** (canvas, no libraries) to look at poses before touching hardware.

## What I owned

The Fusion 360 model and joint geometry, the IK and controller headers, the analysis behind the 6-DOF redesign. I worked in a team of three.

TODO(owner): what the teammates built, in a sentence that doesn't name them.

The receiver firmware file (receiver.cpp) was written by an AI, not by me.

## Result

- Kinematics and control run in simulation, with the numbers above. The controller timing was measured on x86 only.
- The analysis showed that the original three-DOF arm cannot hold an RCM in software. That redirected the design to six axes.
- No mechanical design of our own has been built yet. Joint limits and link lengths are assumptions.

TODO(owner): surgery congress (name, date, what was shown).

## What I'd change

> DRAFT — Teo rewrites this in his own words.

- Add joint-limit and collision checks to the IK, and confirm the possible CAD error before anything is fabricated.
- Measure the controller on the ESP32 instead of extrapolating from x86, and check the geometry against the real arm rather than only the CAD.
