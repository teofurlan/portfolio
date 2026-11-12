---
title: Pricor
summary: Los modelos llenan el formulario, el motor hace las cuentas, tú firmas. Las listas de precios de proveedores en Excel o CSV se convierten en un único catálogo normalizado.
role: Diseño y desarrollo
ownership: >-
  Todo: el contrato de dominio y el motor decimal exacto, los adaptadores de
  archivos, el servidor FastAPI, el ajuste fino de Laya y su corpus sintético,
  el benchmark, la interfaz en React en inglés y español, y la documentación.
---

## Problema

Los comercios pequeños de Argentina (ferreterías, librerías, distribuidoras) reciben cada semana listas de precios de sus proveedores en Excel o CSV. Cada proveedor nombra las columnas a su manera y omite metadatos: si el IVA está incluido o es neto, si el precio es por pack o por unidad, si el descuento es una cadena como `10+5`, qué moneda, qué formato de números. Los sistemas de punto de venta y los ERP solo aceptan formatos rígidos, así que cargar a mano es lento, y una columna mal interpretada corrompe los costos sin avisar.

Pricor convierte esas listas en un único catálogo normalizado que el sistema del propio comercio puede importar.

Es un prototipo de investigación. Todavía no tiene usuarios, ni clientes, ni ahorros de tiempo medidos, y no afirmo tenerlos. Se probó con listas de precios públicas de seis distribuidoras, no en el uso semanal de un comercio.

## Restricciones

- Local y privado: la aplicación escucha solo en 127.0.0.1. La única llamada saliente opcional obtiene la cotización USD a ARS, y puedes reemplazarla a mano.
- Primero Windows. Python 3.13 con uv, Node 22, y Ollama con `gemma4:e4b` y `bge-m3`.
- En la configuración probada hace falta `OLLAMA_FLASH_ATTENTION=0` por un fallo de CUDA en una dependencia externa.
- Fuera de alcance: listas en PDF, consolidar varios proveedores, exportaciones específicas de cada ERP, un instalador.

## La decisión y por qué

**Los modelos proponen, el motor calcula, tú firmas.** Un modelo nunca ejecuta nada ni hace aritmética. Elige roles de columna de un conjunto cerrado, o sugiere respuestas, y tú confirmas.

- **Aritmética decimal exacta.** El motor usa `Decimal` de Python con 50 dígitos de precisión y un único redondeo final (ROUND_HALF_UP).
- **Un catálogo cerrado de operaciones en orden fijo:** interpretar el número, aplicar descuentos, quitar el IVA, pasar a precio por unidad, convertir la moneda, redondear. Cada paso deja un rastro de auditoría, mostrado como la cinta de una sumadora.
- **Una cascada, no un solo modelo.** Primero un clasificador pequeño con ajuste fino (Laya, unos 35 ms por columna en GPU), después Gemma 4 E4B (unos 11 s por hoja en GPU), y al final tú. Una respuesta se acepta sola únicamente por encima de umbrales calibrados con un conjunto de validación de 161 columnas para lograr al menos 95 % de precisión.
- **Una etapa de «acuerdo» quedó afuera.** Las heurísticas junto con Laya llegaron solo a 88,0 % de precisión sin una barra de confianza, así que queda inactiva y no se incluye.
- **Los porcentajes de Excel se leen como puntos porcentuales.** Un `21%` guardado como 0,21 causaría, si no, un error silencioso de 100×.
- **Los planes aprobados se guardan por proveedor.** La lista de la semana siguiente reutiliza el plan y marca solo las columnas que se movieron, se agregaron o faltan.

## Resultado

Medido con un conjunto de prueba reservado de **29 columnas de dos distribuidoras que el sistema nunca había visto**, en una GPU RTX 4060 Laptop. El conjunto es pequeño y le faltan algunos roles (tasa de IVA, unidades por pack, código de barras, descuento, moneda), así que léelo como una primera señal, no como una garantía.

| Enfoque | Columnas correctas |
|---|---|
| Gemma 4 E4B sola | 25 de 29 (86,2 %) |
| Heurísticas | 24 de 29 (82,8 %), optimista: las reglas se escribieron después de ver los encabezados de una distribuidora |
| Laya con ajuste fino | 22 de 29 (75,9 %) |
| Laya sin ajuste (zero-shot) | 18 de 29 (62,1 %) |

La cascada, que solo acepta las respuestas de las que está segura:

- **11 de 29 columnas resueltas automáticamente, 10 correctas (90,9 %).**
- **18 derivadas al usuario (62,1 %), y la mejor sugerencia era correcta en 15 de ellas.**

Es decir, la mayoría de las columnas todavía llega a una persona. Laya resuelve solo cerca del 10 % porque su confianza separa mal por debajo de su umbral.

Velocidad: Laya tarda 35,4 ms por columna en GPU y 516,5 ms en CPU (promedios); Gemma tarda 11,4 s por hoja. El ajuste fino de Laya tomó 290 s y llegó a 6,2 GB de VRAM.

## Lo que cambiaría

> BORRADOR — Teo lo reescribe con sus propias palabras.

- TODO(owner): confirmar. Calibrar Laya con más datos reales de distribuidoras, para que resuelva por sí sola más del 10 % de las columnas.
- TODO(owner): confirmar. Soportar listas de precios en PDF.
- TODO(owner): confirmar. Consolidar varios proveedores en un solo catálogo.
- TODO(owner): confirmar. Validar en hardware solo con CPU, donde no se midieron los números anteriores.
