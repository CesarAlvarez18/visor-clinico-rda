# Modelo anatómico 3D conectado al RDA

- Fecha: 2026-09-20
- Estado: aprobado
- Approach elegido: **A — BodyParts3D con pipeline en Node.** Un script reproducible arma un modelo anatómico real (`anatomy.glb`) a partir de las mallas abiertas de BodyParts3D, con un grupo por sistema corporal. Primero se conecta la vista 3D a los niveles de afectación del RDA; después se reemplaza la anatomía de marcador de posición por el modelo real.
- Spec relacionado: [Silueta del cuerpo interactiva](2026-09-19-silueta-cuerpo.md). Este feature reutiliza sus reglas, su escala y su panel de trazabilidad; no los cambia.

## 1. Overview

El visor ofrece hoy la silueta del cuerpo en 2D. Este feature agrega una **vista 3D con un modelo anatómico real**, a la que el médico cambia con un conmutador **2D / 3D** sin perder el paciente, la atención seleccionada ni el panel de detalle. El cuerpo se ve como un render anatómico: piel azul translúcida en posición anatómica, esqueleto color hueso y fondo azul profundo, con órganos, vasos y nervios visibles en su lugar real. Cada sistema corporal se colorea con el **mismo nivel de afectación** que en la silueta 2D, calculado del RDA de la atención. El valor para el médico es ubicar la afectación en la anatomía real (rotar, acercar, ver qué hay detrás) y explicársela al paciente, con la misma trazabilidad de siempre.

## 2. Usuarios objetivo

- **Médico general o especialista en consulta externa**: usa el 3D para revisar el panorama del paciente y para mostrarle en pantalla qué sistemas están comprometidos.
- **Médico de urgencias y de hospitalización**: normalmente seguirá usando la silueta 2D por rapidez; el 3D es una vista alterna a un clic, no un paso obligatorio.

En todos los casos la herramienta apoya, no diagnostica: el modelo es una representación genérica del cuerpo, **no es la anatomía ni las imágenes del paciente**.

## 3. Contexto del problema

La silueta 2D responde "qué sistemas están afectados y por qué", pero es un esquema plano: los órganos se tapan entre sí, los vasos y nervios son decorativos y no se puede mirar el cuerpo desde otro ángulo. Existe una vista "Anatomía 3D" de demostración (`/?vista=3d`), pero está hecha con figuras geométricas, vive aparte del visor y **no está conectada a los datos del paciente**.

Datos disponibles: los mismos de la silueta. El nivel de cada sistema sale de los `Condition` (CIE-10) del Bundle RDA de la atención y de su rol en `Encounter.diagnosis.use`, con la regla "gana el peor" y la evidencia que lo produjo. Este feature **no agrega reglas clínicas** ni usa recursos FHIR nuevos.

Modelo anatómico: **BodyParts3D** (DBCLS, Japón), mallas de órganos, huesos, vasos y nervios bajo licencia **CC BY-SA 2.1 Japón**, que exige atribución y compartir igual los derivados del modelo.

Restricciones:
- **Solo lectura** y **solo datos sintéticos**, como en el resto del visor. El modelo 3D no contiene datos de pacientes.
- Misma escala de afectación y misma regla de accesibilidad: color **y** texto; "Sin datos" nunca se ve como "Normal".
- Rojo y amarillo no se usan como colores fijos de vasos y nervios, porque pertenecen a la escala (decisión registrada en `CLAUDE.md`).
- Debe funcionar en escritorio y tablet; la silueta 2D sigue disponible siempre.

## 4. Alcance v1

### Incluido
- Conmutador **2D / 3D** en la vista principal del visor. Por defecto se abre en 2D. La elección se mantiene al cambiar de atención.
- Una **figura central** de cuerpo completo, de frente, en posición anatómica, que el médico puede rotar y acercar, con un botón "Vista frontal" para volver al encuadre inicial.
- Estética de render anatómico: fondo azul profundo, piel azul translúcida con borde luminoso, esqueleto color hueso (no pertenece a la escala de niveles).
- Sistemas con estructura propia en el modelo, coloreados según su nivel: **cardiovascular** (corazón y árbol vascular), **respiratorio** (pulmones, tráquea), **nervioso** (cerebro, médula y nervios periféricos), **digestivo** (estómago, intestinos), **hepático** (hígado), **renal / urinario** (riñones, vejiga), **endocrino / metabólico** (tiroides, páncreas), **musculoesquelético** (huesos largos de brazos y piernas, como en la silueta 2D), **reproductor** (órganos pélvicos).
- Sistemas sin órgano localizable como **chips** junto al modelo, igual que en 2D: **tegumentario**, **hematológico / inmune**, **salud mental**.
- Rótulos de nivel en texto para cada sistema con datos, y leyenda con los cinco estados siempre visible.
- Hover (o foco) sobre un sistema: resaltado y tooltip con sistema, nivel y motivo principal. Clic: abre el **mismo panel de trazabilidad** que la silueta 2D.
- Lista de sistemas navegable con teclado, equivalente a hacer clic sobre el modelo.
- El selector de atención, la alerta de triage, "Diagnósticos sin sistema asignado" y el aviso de reglas pendientes de validación funcionan igual en 3D.
- Respaldo automático a la silueta 2D si el equipo no puede mostrar 3D o el modelo no carga, con un aviso.
- Modelo generado por un script reproducible a partir de BodyParts3D, con **atribución y licencia visibles** en el repositorio y en la vista 3D.
- La antigua demostración `/?vista=3d` (fila de figuras) se retira; la vista 3D pasa a vivir dentro del visor.

### Fuera de alcance
- Reglas clínicas nuevas, laboratorios, signos vitales o tendencias.
- Afectación por órgano o por lado (p. ej. solo el riñón izquierdo, solo una pierna): se colorea el sistema completo, como en 2D.
- Músculos detallados, vista por capas que el médico encienda o apague, cortes o transparencias ajustables.
- Modelos por sexo, edad o contextura: v1 usa un único modelo adulto genérico.
- Animaciones fisiológicas (latido, respiración), comparación de dos atenciones lado a lado.
- Reemplazar o retirar la silueta 2D.

### Supuestos
- El modelo optimizado pesa **menos de 10 MB** y se descarga solo cuando el médico abre la vista 3D por primera vez.
- BodyParts3D trae un modelo masculino adulto; se usa para todos los pacientes y se indica como "modelo anatómico genérico".
- La pose de BodyParts3D tiene los brazos menos separados que la imagen de referencia; se acepta la pose del conjunto de datos.
- La licencia CC BY-SA aplica al modelo y sus derivados (el GLB), no al código del visor ni a los datos clínicos. **Pendiente de confirmar** si el proyecto se distribuye fuera del ámbito académico.
- Los colores de nivel en 3D son los mismos de la silueta; con el brillo del render pueden verse distintos, por eso el texto del nivel es obligatorio.

## 5. Comportamiento esperado

### Flujo: Cambiar a la vista 3D
1. El médico tiene cargado un paciente y ve la silueta 2D de la atención más reciente.
2. Pulsa **3D** en el conmutador. Mientras el modelo se descarga ve un indicador "Cargando modelo anatómico…".
3. El sistema muestra la figura de frente, con los sistemas coloreados según los niveles de esa misma atención, rótulos de nivel, chips, leyenda y la nota "Modelo anatómico genérico · BodyParts3D (CC BY-SA 2.1 JP)".
4. El médico arrastra para rotar y usa la rueda o el gesto de pinza para acercar. "Vista frontal" devuelve el encuadre inicial.

### Flujo: Entender por qué un sistema está afectado, en 3D
1. El médico pasa el cursor sobre el hígado. El hígado se resalta y aparece el tooltip: "Hepático · Moderado · K74 Fibrosis y cirrosis del hígado (diagnóstico principal)".
2. Hace clic. Se abre el panel lateral de trazabilidad, idéntico al de la vista 2D, y el hígado queda marcado como seleccionado.
3. Hace clic en los vasos de un brazo: el panel cambia a **Cardiovascular**, porque el árbol vascular pertenece a ese sistema.
4. Cierra el panel con el botón o con Escape y la selección desaparece.

### Flujo: Ver una atención anterior en 3D
1. Con la vista 3D abierta, el médico elige una atención anterior en el selector.
2. El modelo conserva la orientación y el acercamiento; solo cambian los colores, los rótulos, la alerta de triage y el panel (si estaba abierto).
3. El indicador "Viendo: …" cambia igual que en 2D.

### Flujo: Volver a 2D
1. El médico pulsa **2D**. Ve la silueta con la misma atención y el mismo sistema seleccionado, con el panel abierto si lo estaba.

### Flujo: El equipo no puede mostrar 3D
1. El médico pulsa **3D** en un equipo sin soporte gráfico, o el modelo no se puede descargar.
2. El sistema muestra el aviso "No se pudo mostrar el modelo 3D. Se mantiene la silueta 2D." y sigue en 2D, sin perder paciente, atención ni selección.

### Criterios de aceptación

**Conmutador y carga**
- **CA-1** **Dado** un paciente cargado, **cuando** se abre el visor, **entonces** se ve la silueta 2D y un conmutador 2D / 3D con "2D" activo.
- **CA-2** **Dado** la vista 2D, **cuando** el médico pulsa 3D por primera vez, **entonces** ve un indicador de carga y, en una conexión normal, el modelo aparece en menos de 5 segundos; las siguientes veces aparece en menos de 1 segundo.
- **CA-3** **Dado** que el médico nunca pulsa 3D, **cuando** usa el visor, **entonces** el modelo 3D no se descarga.
- **CA-4** **Dado** la vista 3D con un sistema seleccionado, **cuando** el médico pulsa 2D (o al revés), **entonces** se conservan paciente, atención, sistema seleccionado y panel.
- **CA-5** **Dado** un equipo sin soporte 3D o un modelo que no carga, **cuando** el médico pulsa 3D, **entonces** ve el aviso de respaldo y el visor sigue en 2D.

**Niveles en el modelo**
- **CA-6** **Dado** una atención cualquiera, **cuando** se muestra en 3D, **entonces** cada uno de los 12 sistemas tiene exactamente el mismo nivel que en la vista 2D de esa atención.
- **CA-7** **Dado** un sistema "Sin datos", **cuando** se dibuja en 3D, **entonces** sus estructuras usan un tono neutro apagado, sin color de la escala, y nunca el color de "Normal".
- **CA-8** **Dado** el sistema cardiovascular en Grave, **cuando** se dibuja, **entonces** corazón y árbol vascular toman el color de Grave; **dado** que está "Sin datos", **entonces** los vasos se ven en tono neutro, no en rojo.
- **CA-9** **Dado** el sistema nervioso con un nivel, **cuando** se dibuja, **entonces** cerebro, médula y nervios periféricos toman ese color; sin datos, tono neutro, no amarillo.
- **CA-10** **Dado** el sistema musculoesquelético con un nivel, **cuando** se dibuja, **entonces** el nivel se pinta sobre los huesos largos de brazos y piernas; el resto del esqueleto permanece color hueso.
- **CA-11** **Dado** cualquier sistema con datos, **cuando** se dibuja, **entonces** hay un rótulo de texto con su nombre y nivel que no tapa el órgano y sigue siendo legible al rotar el modelo.
- **CA-12** **Dado** los sistemas tegumentario, hematológico / inmune y salud mental, **cuando** se muestra la vista 3D, **entonces** aparecen como chips con nivel en texto y el mismo comportamiento de hover y clic.

**Interacción**
- **CA-13** **Dado** el modelo, **cuando** el médico pasa el cursor sobre una estructura de un sistema, **entonces** se resaltan todas las estructuras de ese sistema y aparece el tooltip con sistema, nivel y motivo principal (o "Sin datos").
- **CA-14** **Dado** el modelo, **cuando** el médico hace clic en una estructura, **entonces** se abre el panel de trazabilidad de su sistema; un arrastre para rotar no cuenta como clic.
- **CA-15** **Dado** que el médico hace clic sobre la piel o el esqueleto no asignado a un sistema, **cuando** no hay estructura de un sistema debajo, **entonces** no se abre ningún panel.
- **CA-16** **Dado** el modelo rotado y acercado, **cuando** el médico cambia de atención, **entonces** la orientación y el acercamiento se conservan y solo cambian los niveles.
- **CA-17** **Dado** el modelo rotado, **cuando** el médico pulsa "Vista frontal", **entonces** vuelve al encuadre inicial.
- **CA-18** **Dado** una tablet (≥ 768 px), **cuando** el médico usa gestos táctiles, **entonces** puede rotar con un dedo, acercar con pinza y abrir un sistema con un toque, sin desplazamiento horizontal de la página.

**Accesibilidad y transparencia**
- **CA-19** **Dado** la vista 3D, **cuando** el médico navega con teclado, **entonces** puede recorrer una lista de los 12 sistemas (nombre + nivel), ver el resaltado en el modelo y abrir el panel con Enter.
- **CA-20** **Dado** un lector de pantalla, **cuando** lee la vista 3D, **entonces** obtiene el nivel de cada sistema desde esa lista, sin depender del lienzo 3D.
- **CA-21** **Dado** que el sistema operativo pide reducir movimiento, **cuando** se muestra el modelo, **entonces** no hay animaciones automáticas (pulsos, vaivén).
- **CA-22** **Dado** la vista 3D, **cuando** se muestra, **entonces** son visibles la leyenda de los cinco estados, la etiqueta "Reglas pendientes de validación clínica" y la atribución del modelo.

## 6. Posibles errores y mitigaciones

| Error / situación | Impacto para el médico | Mitigación |
|---|---|---|
| El modelo tarda o no se descarga | Pantalla vacía o espera | Indicador de carga; si falla, aviso y respaldo a 2D sin perder contexto |
| Equipo sin soporte 3D o con gráfica débil | Vista lenta o que no abre | 2D es la vista por defecto; detección de soporte; calidad gráfica reducida en tablet |
| "Sin datos" leído como "Normal" o como sano | Falsa tranquilidad | Tono neutro apagado fuera de la escala, sin rótulo de nivel coloreado, leyenda visible, lista de sistemas con el texto "Sin datos" |
| Vasos rojos o nervios amarillos interpretados como Grave / Leve | Lectura errónea del nivel | Vasos y nervios solo usan colores de la escala cuando su sistema tiene ese nivel; sin datos, tono neutro |
| El brillo y la transparencia del render alteran los colores de la escala | Confundir Moderado con Grave | Texto del nivel siempre presente; colores probados sobre el fondo azul y en simulación de daltonismo |
| El médico cree que el modelo es la anatomía del paciente | Interpretación indebida | Nota visible "Modelo anatómico genérico"; ninguna lesión ni lateralidad se dibuja |
| Modelo masculino para una paciente (o pediátrico) | Órganos reproductores que no corresponden | El sistema reproductor se colorea como región pélvica genérica y el rótulo usa solo el nombre del sistema; modelos por sexo quedan como mejora futura |
| Órganos tapados por otros o por el esqueleto | No se ve un sistema afectado | Rotación y acercamiento; rótulos con línea guía; lista de sistemas siempre completa |
| Clic accidental al rotar | Paneles que se abren solos | Distinguir arrastre de clic |
| Una malla del modelo queda sin sistema asignado o mal asignada | Un órgano no se colorea o se colorea con otro sistema | Tabla parte → sistema revisable en el repositorio; comprobación automática de que cada sistema con órgano tiene al menos una estructura en el modelo; asignación anatómica **pendiente de validación clínica** |
| Diferencias entre 2D y 3D para la misma atención | Desconfianza en la herramienta | Ambas vistas leen el mismo estado calculado; prueba automática de equivalencia |
| Incumplir la licencia CC BY-SA del modelo | Riesgo legal para el proyecto | Atribución a BodyParts3D / DBCLS en la vista y en el repositorio; el GLB derivado se comparte con la misma licencia; registro del origen y la versión de las mallas |
| Datos reales en capturas o demostraciones del 3D | Violación de privacidad | Solo Bundles sintéticos; el modelo no contiene datos clínicos |

---
Preguntas abiertas:
- ¿Quién valida la asignación de estructuras anatómicas a sistemas (p. ej. páncreas solo en endocrino, bazo en hematológico como chip o como órgano)?
- ¿Basta un modelo genérico masculino para v1 o se necesita pronto un modelo femenino? BodyParts3D no lo trae.
- ¿La vista 3D debe recordar la preferencia del médico entre sesiones, o siempre abrir en 2D?
- ¿Se incluye una capa muscular tenue para acercarse a la imagen de referencia, o se deja para una versión posterior por peso del modelo?
- ¿La licencia CC BY-SA del modelo es compatible con la forma en que se piensa distribuir el visor?
