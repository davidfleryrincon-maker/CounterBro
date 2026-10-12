# Gecko de CounterBro (integración aislada)

Esta carpeta contiene una primera integración opcional del acompañante visual. No altera el motor de counters ni los datos.

## Activar/desactivar
En `index.html`, antes de cargar `counterbro-gecko/gecko.js`, definir:
```js
window.COUNTERBRO_GECKO = { enabled: true };
```
Para apagarlo, usar `enabled: false` o quitar el script. La configuración predeterminada es apagada.

## Estado de esta primera integración
- Aislado en esta carpeta.
- Respeta `prefers-reduced-motion`.
- No bloquea controles ni intercepta clics.
- El sprite SVG incluido es una versión de integración básica; aún no sustituye la revisión final de todos los cuadros PNG del prototipo aprobado.
- No se habilita por defecto en producción.
