# MTDS evidence (explorer mwcgvb28, 2026-11-11, read-only)

Paths relative to ../mtds-brazo-robot/; doc sections in 01_Documentacion/Investigacion/Contexto_detalle/. Never publish local paths in site copy.

- Problem: low-cost, reproducible robot arm with remote center of motion (RCM) for laparoscopic surgery training by teleoperation, for university settings (01_Documentacion/Proyecto_Actual/CONTEXTO_PROYECTO.md:101). Client asked for "RCM por SOFTWARE" (06_v2_brazo6ejes.md §23).
- Constraints: reuse already-bought hardware: 3× NEMA17, DRV8825, RAMPS 1.6, 12 V PSU, Mega + 2× ESP32, servos (CONTEXTO §0; 05_hardware_electronica.md §5). Tight deadline, no date. Team of 3 plus supervisor (CLAUDE.md:4-5).

## CV claims vs repo (CV is authoritative per BRIEF, but BRIEF also forbids invented metrics: Teo decides)
| CV claim | Repo verdict |
|---|---|
| Closed-form C++ IK | Confirmed (02_Codigo/Headers_Comunes/ik_mtds.h:80-82) |
| "validated against the CAD model to 3 micrometres" | MISMATCH: 3 µm came from superseded geometry; §18 says that check measured internal consistency, not CAD fidelity. Current: FK vs live CAD 0.003 mm (= 3 µm) (geom_mtds.h:16-18); IK round-trip 0.0004 mm over 32k poses (test_ik.cpp:7-29, 02_rcm §21) |
| "at 0.1% of the 50 Hz control loop" | EXTRAPOLATED: 0.383 µs measured on x86; ESP32 figure assumes a 30–50× slowdown, never measured on hardware (02_rcm §15) |
| Tool-space resolved-rate control | Confirmed: damped least squares, adaptive λ (ctrl_mtds.h:37,63,241-254). 0.123 µs/cycle x86, 0 limit violations in 200k cycles (test_ctrl.cpp:105), Jacobian error 2.2e-10 |
| Software RCM unreachable, two DOF short, five checks | Confirmed in docs: Jacobian rank exactly 2 over 3000 poses; best pseudo-RCM median 101 mm, 219 mm over full range (02_rcm §17.1-17.2). Check scripts not found in repo |
| Structural fix, all four DOF, no extra motors | OVERSTATED: a proposal, not built (adds a linear axis, removes J3); superseded 2026-09-10 by a 6-DOF software-RCM design with 6 motors (02_rcm §17.3; CONTEXTO §0) |
| Browser 3D simulator | Confirmed: canvas projection, no libraries (03_Diseno/Visualizadores/simulador_v1.html) |
| Fusion 360 automation via Python API | Partial: run through an MCP bridge to Fusion; scripts not in repo (01_fusion_cad.md §9,§14) |

- Surgery congress: NOT FOUND in the repo. TODO(owner): name and date.
- Demo video: 04_Produccion/Videos/brazo_robot_demo.mp4 (552 MB); repo says it is invalid as RCM evidence (missing J4) (03_simuladores §16.3).
- Ownership (documented): Teo did the Fusion model and joint geometry, IK/controller headers, v2 analysis, dome measurements. Teammates' parts: unclear — TODO(owner). receiver.cpp written by an AI, not Teo (03_simuladores.md:10).
- Stack: C++ (ESP32, Arduino Mega, ESP-NOW, PlatformIO), Python/numpy, HTML/JS canvas, Fusion 360.
- Year: 2026 (docs 2026-08-18 to 2026-09-22). Repos: https://github.com/teofurlan/mtds-brazo-robot (visibility unverified); CV links https://github.com/teofurlan/robot-arm (firmware, not inspected).
- Media candidates: 04_Produccion/Imagenes/modelo_3d_mtds.png (render), Fotos_Hardware/Control Remoto - frente.jpg (not checked for people).
- Limitations (repo words, Spanish): designs must be redone once one is chosen; "No hay ningún diseño mecánico propio todavía"; joint limits and link lengths are assumed; IK checks no joint limits or collisions; possible CAD error to confirm before fabricating.
- Never publish: teammates'/supervisor's full names without consent, university dome photos/measurements, course folder names, git emails, local paths.

## Owner decision (2026-11-11)

Teo: "The repo is out of date." The CV wording is authoritative; the CV-vs-repo table above is historical. Team: "We built the robot arm as a team, didn't divide the tasks." Repos are not public.
