---
title: Socra
summary: Una capa de voz local para cualquier agente o arnés de programación. El modelo habla y tú respondes en voz alta.
role: Diseño y desarrollo
ownership: >-
  Todo: el servidor en Python (voz a texto, texto a voz, MCP sobre stdio,
  WebSocket), los backends de agentes, y la página en React que muestra
  solo código, solicitudes de permiso o la respuesta.
---

## Problema

Quien trabaja con un agente de programación todo el día a veces quiere que lo examinen en voz alta sobre un proyecto que construyó, o dirigir una sesión de programación por voz. Socra es una capa de voz local y privada para eso: el modelo habla, tú respondes en voz alta, y la página muestra solo código, solicitudes de permiso o la respuesta.

## Restricciones

- Privado: el servidor escucha solo en 127.0.0.1, y nada sale de la máquina salvo lo que envía el propio agente.
- Primero Windows. Python 3.12+, Node 22+, un micrófono y Edge o Chrome. Una GPU NVIDIA es opcional; funciona con CPU.
- Un presupuesto de transcripción de 3,0 s o menos.
- El modelo de voz de Piper pesa unos 79 MB.

## Decisiones

- **Cambiar de modo es un traspaso, no una reanudación.** Reanudar conservaría el prompt de sistema anterior y un contexto que no deja de crecer.
- **Whisper large-v3-turbo como opción por defecto.** El objetivo es la mayor precisión de reconocimiento y robustez frente a acentos y jerga.
- **Decir cada respuesta oración por oración mientras aún se está escribiendo**, para que la respuesta empiece antes de terminar.
- **Primero inglés, una sola voz.** En inglés la voz suena menos robótica y Whisper transcribe mejor. Una prueba mantiene el idioma en una única fuente.
- **80 ms de entrada antes de hablar.** Entradas de 30 a 75 ms cortan el primer fonema; una prueba exige al menos 60 ms.

## Lo que hice yo

Proyecto individual, construido con agentes de programación: todo, desde el servidor y la canalización de audio hasta la página en React y las pruebas.

## Resultado

Socra funciona y su autor lo usa a diario. No tiene usuarios, testimonios ni prensa, y no afirmo tenerlos.

Existe una medición, con una salvedad. En una RTX 4060 de 8 GB, con audio sintetizado en **español**, medido **antes del cambio a inglés**:

| Modelo | Tiempo de transcripción | Carga del modelo |
|---|---|---|
| large-v3-turbo, CUDA fp16 | 0,55 s y 0,43 s (dos clips) | 4,35 s |
| small | 0,30 s (primer clip) | no registrado |
| base | 0,60 s (primer clip) | no registrado |

La velocidad de extremo a extremo no se ha medido.

TODO(owner): resultado del A/B ciego de voces. Las calificaciones están en el localStorage del navegador y el ganador solo aparece en una nota borrador, así que no se indica aquí.

## Lo que cambiaría

> BORRADOR — Teo lo reescribe con sus propias palabras.

- Medir la latencia de extremo a extremo y repetir la prueba de Whisper con audio en inglés, ya que los números actuales son en español.
- Hacer que las preguntas de Pi que requieren una elección o texto libre se puedan responder por voz. Hoy se cancelan.
