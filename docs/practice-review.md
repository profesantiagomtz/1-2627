# Revisión didáctica: estudiantes sin experiencia

## Simplificación de la plataforma — doble revisión previa

1. Comprensión: la experiencia muestra una sola decisión a la vez. Sin sesión, únicamente acceso. Con sesión, únicamente el Ejercicio 1 y sus tres acciones: descargar, resolver y entregar. Se eliminan navegación, estadísticas, simuladores, rutas futuras, promociones y explicaciones que compitan con la tarea.
2. Continuidad: permanecen registro, inicio, recuperación de contraseña, cierre de sesión, descarga, revisión automática, guardado e historial del Ejercicio 1. Las actividades anteriores se ocultan de la interfaz, pero su código y sus datos no se eliminan.

Verificación prevista: tipos, pruebas y compilación de producción. No se realizará una prueba visual en navegador salvo solicitud expresa del docente.

## Ejercicio 1 con archivo real — doble revisión previa

1. Comprensión: tres acciones visibles — descargar, resolver y entregar. Una sola oración por acción. El alumno escribe los números dentro de los círculos, guarda en Word y selecciona el archivo guardado. Mensajes cortos para formato incorrecto, tamaño excesivo y archivo equivocado.
2. Correspondencia: se conserva una copia del original del docente. El revisor identifica cada círculo por el nombre interno de su forma, no por el orden de aparición ni por encontrar los números 1 a 10 en cualquier sitio. Cada acierto vale 10 puntos. El archivo y la nota se guardan solo al pulsar Guardar entrega y requieren sesión. El bucket es privado; cada alumno solo puede leer su carpeta. La función del servidor recalcula la nota y exige que el archivo exista antes de registrar el intento.

## Documento editable — doble revisión previa

1. Comprensión: separar entrenamiento y entrega; explicar selección, escritura, corrección y alineación. Tres párrafos delimitados (título, nombre, grupo) para una primera práctica acotada. La guía debe indicar que Enter pasa al siguiente párrafo y que las etiquetas no forman parte del documento. Reto con título distinto, criterios y pesos visibles, sin señales de respuesta. No puntuar rapidez ni orden de clics.
2. Correspondencia: escribir modifica el documento; negrita afecta exclusivamente el texto seleccionado; centrar afecta el párrafo activo. Permitir ratón, teclado y selección asistida para pantalla táctil. Evaluar el estado final con los mismos criterios en cliente y servidor; no sumar estos resultados al bloque previo ni cambiar notas históricas. Guardar por usuario con identificador idempotente. No confundir revisión en pantalla con guardado confirmado. No prometer edición completa de Word ni archivos .docx.

Verificación posterior: 21 pruebas de lógica aprobadas y compilación/tipos correctos. Pruebas transaccionales en Supabase aprobadas para notas 0/45/70/85/100, negrita parcial, forma/tamaño del documento, autorización, idempotencia, colisiones entre usuarios y lectura aislada. Datos ficticios revertidos. Los espacios especiales del editor se normalizan antes de enviar el documento. Esta entrega no incluye prueba de interacción o revisión visual en navegador; queda pendiente validación de usabilidad con el docente. El editor comienza abierto y con tres párrafos delimitados; las rutas para abrir Word siguen en las lecciones de orientación. La práctica guiada no se guarda, el reto sí guarda documento y resultado; no se genera un .docx.

## Rediseño de interfaz — doble revisión previa

1. Jerarquía: navegación azul tinta, acción principal azul, estadísticas compactas y simulación diferenciada. Eliminar competencia visual entre bloques; conservar Windows como superficie funcional, sin ilustraciones decorativas.
2. Continuidad didáctica: conservar textos, ayudas paso a paso, acceso a cuenta, resultados y guardado. Agrupar instrucciones generales en apartados explícitos, sin ocultar los pasos de la práctica guiada. En pantallas amplias, mostrar guía junto al simulador; en pantallas pequeñas, antes. Mantener nombres y funciones de controles, notas solo en lectura y reglas de evaluación.

Verificación prevista: compilación, tipos, pruebas existentes y comprobaciones estructurales. No sustituye una prueba visual o de usabilidad con estudiantes.

## Notas «¿Sabías que…?» — revisión previa

1. Exactitud: contrastados documentos recientes y plantillas con «Tareas básicas en Word»; contador con «Mostrar recuento de palabras»; zoom con «Acercar o alejar un documento», todos de Microsoft. Fuentes junto a cada nota. No se incorpora el supuesto límite de 1,000 páginas.
2. Claridad y correspondencia: cuatro notas breves con ejemplos, ligadas a las tres lecciones. Solo se muestran en lectura, no en práctica ni reto. Se distinguen de instrucciones y calificaciones, y advierten que describen Word real, no funciones nuevas del simulador.

Alcance: las tres lecciones disponibles y las rutas libres del escritorio. No incluye lecciones en preparación.

## Primera revisión previa: comprensión

- Faltaban definiciones de clic, doble clic, icono, documento, plantilla e interfaz.
- Instrucciones breves no explicaban ubicación, acción y resultado por separado.
- No siempre se diferenciaban exploración sin nota, práctica guiada y reto.
- Faltaban instrucciones explícitas para corregir, avanzar y guardar el resultado.

## Segunda revisión previa: correspondencia con la implementación

- Buscar era una lupa sin texto visible: agregar la etiqueta que usan las instrucciones.
- Los resultados se muestran después de Siguiente paso; no prometer aparición inmediata.
- El buscador se reiniciaba al cambiar de paso: conservar Word en el paso de resultados.
- Crear y abrir solo muestran confirmaciones; explicitar que no se edita un archivo real.
- Las zonas de interfaz son objetivos completos, no herramientas individuales funcionales.
- El escritorio usa contorno naranja, no siempre un letrero de clic: distinguir las dos señales.
- Los accesos alternativos no cuentan para la evaluación de Inicio/búsqueda; mantener esta distinción.

Revisión de texto y código, no una prueba de usabilidad con alumnos ni una prueba visual en navegador. No afirmar ausencia absoluta de dudas. Antes de futuras implementaciones, repetir ambas revisiones, verificar los nombres visibles y comprobar transiciones, errores, guardado y diferencias entre práctica y reto.
