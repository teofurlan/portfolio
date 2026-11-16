---
title: Brazo robótico MTDS
summary: Un brazo robótico de bajo costo para entrenamiento en cirugía laparoscópica por teleoperación, construido en torno a un centro remoto de movimiento.
role: Software de control y simulación (proyecto de investigación universitario)
ownership: >-
  Construido en un equipo de tres sin reparto fijo de tareas. Mi foco fue el
  software de control y la simulación: la capa de movimiento en C++ (cinemática
  inversa y control en el espacio de la herramienta), la investigación sobre el
  centro remoto de movimiento, el simulador 3D en el navegador y la
  automatización de Fusion 360.
---

## Problema

Los entornos universitarios necesitan un brazo robótico de bajo costo y reproducible para entrenar cirugía laparoscópica por teleoperación. Las herramientas laparoscópicas pivotan alrededor de un punto fijo en la incisión, el centro remoto de movimiento (RCM). Nuestro plan era mantener ese punto por software.

## Restricciones

- Reutilizar el hardware que ya estaba comprado: motores paso a paso NEMA17, drivers DRV8825, una placa RAMPS 1.6, un Arduino Mega y dos placas ESP32.
- Una fecha límite ajustada y un equipo de tres.

## Decisiones

- **Cinemática inversa analítica de forma cerrada en C++**, sin un solver iterativo que ajustar ni que converger, de modo que cabe con holgura en el lazo de control de 50 Hz.
- **Control de velocidad resuelta en el espacio de la herramienta**, para que quien opera mueva la punta del instrumento y el controlador calcule las articulaciones.
- **Investigar antes de construir la restricción.** Cinco verificaciones numéricas independientes, en lugar de confiar en un solo modelo.
- **Cambiar de dirección a tiempo.** Cuando vimos que el RCM por software no daba más, pasamos a una corrección estructural en lugar de forzarlo.
- **Un simulador 3D en el navegador**, para que el equipo y el cliente puedan operar el brazo sin hardware.
- **Automatizar el trabajo de CAD.** Ensamblaje y mediciones en Fusion 360 mediante su API de Python.

## Lo que hice yo

Construimos el brazo en un equipo de tres, sin un reparto fijo de tareas. Mi foco fue el software de control y la simulación: la capa de movimiento en C++, la investigación sobre el RCM, el simulador y la automatización de Fusion 360.

## Resultado

- Validé la cinemática inversa contra el modelo CAD, con pruebas unitarias y sin advertencias de compilación.
- Investigamos si el RCM por software planificado era posible en el brazo construido. Cinco verificaciones numéricas mostraron que no (le faltaban dos grados de libertad), así que cambiamos a tiempo la dirección del desarrollo, hacia una corrección estructural que logra los cuatro grados de libertad laparoscópicos sin motores adicionales.
- Construí un simulador en el navegador para que el equipo y el cliente puedan operar el brazo sin hardware.

## Lo que cambiaría


- Haría esa investigación antes de comprar el hardware, no después.
