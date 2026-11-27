---
name: "identidad-visual-barranquilla"
description: "Aplica el manual de identidad visual de la Alcaldía de Barranquilla (2024) a afiches, presentaciones, apps o piezas sobre Barranquilla, sin que parezcan comunicación oficial."
---

# Identidad visual de Barranquilla para proyectos propios

Fuente: Manual de Identidad Visual de la Alcaldía de Barranquilla, mayo de 2024, hecho para cumplir la Ley 2345 de 2023 ("Chao marcas de gobierno"). Si el proyecto tiene el PDF del manual, consúltalo para los detalles. Esta skill resume lo que se puede reutilizar en proyectos que no son de la Alcaldía, como bootcamps, trabajos académicos o propuestas cívicas.

Responde en el idioma del usuario (normalmente español).

## 1. Paleta (códigos exactos)

| Color | HEX | RGB | CMYK | Uso sugerido |
| --- | --- | --- | --- | --- |
| Azul oscuro | #142334 | 20 35 52 | 100 80 50 60 | Fondo principal y texto sobre claro |
| Verde | #279B48 | 35 155 72 | 90 0 100 0 | Bandas, rótulos y estados positivos |
| Amarillo | #FFEA00 | 255 234 0 | 0 0 100 0 | Solo como acento: palabra clave, píldora o dato |
| Blanco | #FFFFFF | 255 255 255 | 0 0 0 0 | Fondos de lectura |

Los colores vienen de la bandera cartagenera: amarillo y verde enmarcados en el azul del río y el mar. No inventes otros tonos de marca. Para fondos neutros usa grises muy claros, como #F2F4F6.

**Contraste (WCAG AA):**
- El amarillo nunca va como texto sobre blanco. Úsalo sobre azul oscuro, o como fondo con texto azul oscuro encima.
- El texto blanco sobre verde solo va en negrita y grande (18 pt o más, o 14 pt en negrita). El texto pequeño sobre verde va en azul oscuro.
- El azul oscuro sobre blanco pasa en cualquier tamaño.
- En impresión no pongas verde sobre azul ni azul sobre verde, porque se pierde el contraste (lo señalaron en la socialización del manual).

## 2. Tipografía

- La fuente institucional es Volkswagen Serial (SoftMaker): redondeada y pesada en Black o Heavy para títulos. Es comercial y necesita licencia.
- El sustituto libre recomendado es **Nunito** de Google Fonts: 900 para títulos y 400 a 700 para cuerpo. Otras opciones parecidas son Varela Round o M PLUS Rounded 1c.
- Para documentos formales (actas, memorandos, informes) el manual usa **Arial**.
- Los titulares van en MAYÚSCULAS, apilados en 2 a 4 líneas, con interlineado apretado (0,9) y una palabra destacada en amarillo.

## 3. Estilo visual

- "Menos es más": bloques planos de color, geometría simple y lenguaje sencillo.
- Los titulares grandes en mayúsculas van sobre fotografía de ciudad: atardecer en el río, Malecón, Ventana al Mundo, Estadio Metropolitano o vista aérea.
- El manual usa retículas para formatos 1:1, 4:3 y 9:16. Pon el texto en un bloque superior o lateral y deja aire.
- Los iconos van con trazo grueso redondeado, en un solo color.
- No uses degradados, sombras, texturas ni efectos 3D sobre los elementos de marca.

## 4. Logo, escudo y lo que NO se usa en piezas no oficiales

El imagotipo "Alcaldía de BARRANQUILLA" y el escudo están reservados para la entidad, sus dependencias y el cobranding formal con otras entidades. El manual advierte que un mal uso "pone en duda el carácter oficial" de la pieza. Por eso, en proyectos propios:

- **No** pongas el imagotipo ni el escudo de la Alcaldía.
- **No** pongas la franja vertical "barranquilla.gov.co" ni la barra inferior azul con el logo, porque son la firma de las piezas oficiales.
- **No** uses cuentas, vocerías ni nombres de funcionarios. La Ley 2345 prohíbe además mensajes políticos y marcas de gobierno.
- **Sí** puedes usar la paleta, el tono tipográfico y el estilo de titulares, siempre con una marca propia del proyecto bien visible.
- Si de verdad se necesita el logo, hay que pedir autorización a la Secretaría de Comunicaciones (Grupo Interno de Trabajo Marca y Publicidad) bajo las reglas de cobranding.

Si alguna vez se usa el logo oficial con permiso, sigue las reglas del manual: no girarlo, inclinarlo, deformarlo ni cambiarle el color; no ponerle sombras, contornos, degradados ni formas detrás; respetar el área de protección (2X arriba y abajo, 1X a los lados); y respetar los tamaños mínimos (horizontal de 2,6 × 0,6 cm, ultrahorizontal de 3,5 × 0,3 cm, isotipo de 0,6 × 0,62 cm).

## 5. Imágenes

- Prefiere fotos propias, imágenes generadas sin texto ni logos, o fotos de Wikimedia Commons con su crédito (CC BY-SA).
- Las fotos y renders de prensa o de la Alcaldía tienen derechos de autor. Pide permiso o úsalas solo en el aula, con crédito.
- Fíjate si la imagen trae logos de terceros (clubes, FCF, FIFA, patrocinadores). Si los trae, recórtala u oscurécela.
- En prompts de generadores de imagen agrega siempre: "sin escudos, sin logos de gobierno ni de la FIFA, sin políticos, sin texto".

## 6. Cómo aplicarla

1. Confirma el formato (A3 o A4 vertical, 1080×1350, 9:16 o diapositiva 16:9) y el público.
2. Define los tokens en CSS o en el diseño: `--azul:#142334; --verde:#279B48; --amarillo:#FFEA00; --blanco:#FFFFFF; --gris:#F2F4F6`.
3. Carga Nunito desde Google Fonts, salvo que el usuario tenga licencia de Volkswagen Serial.
4. Arma la jerarquía: un titular apilado (nivel 1), una frase clave (nivel 2), rótulos en mayúsculas espaciadas de 12 pt (nivel 3) y cuerpo de 11 a 12 pt como mínimo.
5. Usa el amarillo como máximo en tres lugares por pieza.
6. Si el contexto es ficticio o académico y la pieza se va a publicar fuera del aula, sugiere una línea de aviso (por ejemplo, "Pieza académica; no es comunicación oficial de la Alcaldía de Barranquilla"). Si el usuario decide quitarla, respétalo y menciónale el riesgo una sola vez.

## 7. Lista de chequeo antes de entregar

- [ ] Solo se usan los colores de la paleta, con los códigos exactos.
- [ ] El amarillo nunca aparece como texto sobre blanco.
- [ ] Los titulares van en una sans redondeada y pesada, en mayúsculas.
- [ ] No aparecen el escudo, el imagotipo, "barranquilla.gov.co" ni nombres de funcionarios.
- [ ] La marca propia del proyecto se ve claramente.
- [ ] Las imágenes tienen licencia o crédito y no traen logos de terceros visibles, o el usuario lo aceptó.
- [ ] El texto se puede leer a distancia y hay poco texto: lo que no cabe se dice en la presentación.
