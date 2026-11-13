---
title: Brazo robótico MTDS
summary: Un brazo robótico de bajo costo para entrenamiento en cirugía laparoscópica por teleoperación, construido en torno a un centro remoto de movimiento.
role: Software de control y simulación (proyecto de investigación universitario)
ownership: >-
  Construido en un equipo de tres sin reparto fijo de tareas. Mi foco fue el
  software de control y la simulación: la capa de movimiento en C++ (cinemática
  inversa y control en el espacio de la herramienta), el análisis de factibilidad
  del centro remoto de movimiento, el simulador 3D en el navegador y la
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
- **Comprobar la factibilidad numéricamente antes de construir la restricción.** Cinco verificaciones numéricas independientes, en lugar de confiar en un solo modelo.
- **Informar el resultado negativo** en lugar de entregar una restricción falsa.
- **Un simulador 3D en el navegador**, para que el equipo y el cliente puedan operar el brazo sin hardware.
- **Automatizar el trabajo de CAD.** Ensamblaje y mediciones en Fusion 360 mediante su API de Python.

## Lo que hice yo

Construimos el brazo en un equipo de tres, sin un reparto fijo de tareas. Mi foco fue el software de control y la simulación: la capa de movimiento en C++, el análisis de factibilidad, el simulador y la automatización de Fusion 360.

## Resultado

- Validé la cinemática inversa contra el modelo CAD hasta 3 micrómetros, usando el 0,1% del lazo de control de 50 Hz, con pruebas unitarias y sin advertencias de compilación.
- Demostré que el RCM por software planificado era inalcanzable en el hardware construido, a dos grados de libertad de distancia, y encontré una corrección estructural que logra los cuatro grados de libertad laparoscópicos sin motores adicionales.
- Construí un simulador en el navegador para que el equipo y el cliente puedan operar el brazo sin hardware.

## Lo que cambiaría

> BORRADOR — Teo lo reescribe con sus propias palabras.

- Ejecutaría la verificación de factibilidad antes de comprar el hardware, no después.
