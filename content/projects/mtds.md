---
title: MTDS robot arm
summary: A low-cost robot arm for laparoscopic surgery training by teleoperation, built around a remote center of motion.
status: featured
order: 2
role: Control software and simulation (university research project)
team: 3
ownership: >-
  Built as a team of three with no fixed split of tasks. My focus was the control
  software and simulation: the C++ motion layer (inverse kinematics and
  tool-space control), the feasibility analysis of the remote center of motion,
  the browser 3D simulator and the Fusion 360 automation.
stack: [C++, ESP32, Arduino Mega, Python, JavaScript, Fusion 360]
tags: [hardware, robotics]
links: {}
media: []
year: 2026
---

<!-- Sources: inputs/cv/resume.tex (Projects > MTDS), authoritative per Teo
(2026-11-11: "the repo is out of date"). Problem and constraints from
odd/evidence/mtds.md (mtds-brazo-robot repo: CONTEXTO_PROYECTO.md,
05_hardware_electronica.md). Team: Teo, 2026-11-11: "We built the robot arm as a
team, didn't divide the tasks"; teammates are not named. Repos are private: no
repo link. Order 2 chosen by Teo.
Media candidates, not copied yet: 04_Produccion/Imagenes/modelo_3d_mtds.png
(render); Fotos_Hardware/Control Remoto - frente.jpg (check for people first).
Demo video brazo_robot_demo.mp4 (552 MB). -->

## Problem

University settings need a low-cost, reproducible robot arm to train laparoscopic surgery by teleoperation. Laparoscopic tools pivot about a fixed point at the incision, the remote center of motion (RCM). Our plan was to hold that point in software.

## Constraints

- Reuse hardware that was already bought: NEMA17 stepper motors, DRV8825 drivers, a RAMPS 1.6 board, an Arduino Mega and two ESP32 boards.
- A tight deadline and a team of three.

## Decisions

- **Closed-form analytic inverse kinematics in C++**, with no iterative solver to tune or converge, so it fits comfortably inside the 50 Hz control loop.
- **Tool-space resolved-rate control**, so the operator moves the instrument tip and the controller works out the joints.
- **Check feasibility numerically before building the constraint.** Five independent numerical checks, instead of trusting one model.
- **Report the negative result** instead of shipping a fake constraint.
- **A browser 3D simulator**, so the team and the client can operate the arm without hardware.
- **Automate the CAD work.** Assembly and measurements in Fusion 360 through its Python API.

## What I owned

We built the arm as a team of three, without a fixed split of tasks. My focus was the control software and simulation: the C++ motion layer, the feasibility analysis, the simulator and the Fusion 360 automation.

## Result

- I validated the inverse kinematics against the CAD model to 3 micrometres, at 0.1% of the 50 Hz control loop, unit tested and warning-clean.
- I showed that the planned software RCM was unreachable on the built hardware, two degrees of freedom short, and I found a structural fix that yields all four laparoscopic degrees of freedom with no extra motors.
- I built a browser simulator so the team and the client can operate the arm without hardware.

## What I'd change


- I'd run the feasibility check before the hardware is bought, not after.
