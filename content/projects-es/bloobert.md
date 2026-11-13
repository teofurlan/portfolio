---
title: Bloobert
summary: Una mascota de escritorio de gelatina translúcida que se derrite mientras estás sentado y recupera su forma cuando hacés un descanso activo.
role: Diseño y desarrollo
ownership: >-
  Todo: la definición del producto, la app en Tauri 2 y Rust, la detección de
  inactividad y presencia, el sonido procedural, el renderizado SVG y los archivos
  de guardado locales. Construido con agentes de programación.
---

## Problema

Las personas pasan horas sentadas frente a la computadora sin descansos. Construí Bloobert, una mascota de gelatina translúcida que se derrite mientras estás sentado y recupera su forma cuando hacés un descanso activo. Definí el éxito como usarlo yo mismo todos los días de trabajo. No hice investigación con usuarios.

## Restricciones

- Primero Windows 11, después macOS.
- Solo local: sin cuenta, sin telemetría. La detección de inactividad lee únicamente una marca de tiempo, nunca qué teclas se presionaron.
- Una ventana pequeña, transparente y siempre visible (252×182).
- Una presencia desconocida no debe adelantar el reloj de estar sentado: derretirse injustamente es peor que derretirse tarde.

## Decisiones

- **Tauri 2 en lugar de Electron.** Reutiliza el prototipo existente en SVG y WebAudio, Rust lee el tiempo de inactividad y el tamaño es pequeño. Un spike no encontró ningún criterio de fallo que exigiera Electron. No medí una línea base con Electron.
- **Sonido procedural.** WebAudio en TypeScript: un oscilador triangular por vocal, una caída de tono, un filtro pasa-bajos y jitter aleatorio, más grave y más lento a medida que Bloobert se derrite. No necesita actor de voz, no tiene licencias de voz y funciona en cualquier idioma.
- **Renderizado SVG.** Un aspecto de sticker portado desde un estudio de diseño. El 3D con Three.js es el plan B.
- **Detección de descansos por capas.** El tiempo de inactividad en bruto no puede decir si estás sentado. Las capas son un período de gracia de entrada (se propone 5 minutos), luego si se está reproduciendo contenido multimedia y, por último, una cámara opcional solo durante los descansos.
- **Guardado seguro.** Las escrituras son atómicas. Un archivo de guardado ilegible o de versión desconocida se renombra, nunca se sobrescribe.

## Lo que hice yo

Todo, trabajando con agentes de programación: la definición del producto, la arquitectura, el código en Rust y TypeScript, el diseño y las pruebas.

## Resultado

- Funciona como app de escritorio. El spike midió un conjunto de trabajo de unos 37 MB, en una **compilación de depuración**, "observado aproximadamente". No medí el tamaño ni la CPU de la versión de lanzamiento.
- Las pruebas de Rust crecieron a 126 y la suite del frontend pasa 11 de 11.
- Cinco mutaciones deliberadas de la regla de descanso hicieron fallar sus pruebas.
- Todavía no hay versión de lanzamiento ni instalador.

## Lo que cambiaría


- Mediría una compilación de lanzamiento (tamaño, CPU) y comprobaría el borde de la ventana transparente en Windows y el comportamiento de click-through, que la documentación indica como pendientes de verificar.
- Sin la cámara, la detección de descansos se basa en la confianza. Todavía tengo que decidir si eso es aceptable o si hace falta otra señal.
