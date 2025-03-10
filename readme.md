# Web Scraper Asíncrono

Esta aplicación web permite realizar scraping de contenido web de manera asíncrona desde el navegador. Puedes ingresar una URL y un XPath para extraer información específica de cualquier sitio web.

## Características

- Interfaz de usuario construida con HTML y Tailwind CSS
- Scraping asíncrono con JavaScript usando fetch() y XPath
- Extracción de elementos basada en XPath
- Manejo de errores y carga visual
- Diseño responsive

## Demo en vivo

La aplicación está desplegada en GitHub Pages y se puede acceder desde [este enlace](#) (actualizar con el enlace real una vez desplegado).

## Capturas de pantalla

(Aquí puedes añadir capturas de pantalla de la aplicación)

## Instalación local

Para configurar este proyecto localmente, sigue estos pasos:

### Requisitos previos

- [Node.js](https://nodejs.org/) (v12.0.0 o superior)
- [npm](https://www.npmjs.com/) (generalmente viene con Node.js)

### Pasos de instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/tu-usuario/web-scraper-asincrono.git
   cd web-scraper-asincrono
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Compila los estilos de Tailwind CSS:
   ```
   npm run build
   ```

4. Abre el archivo `index.html` en tu navegador o usa un servidor local como [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) para VS Code.

### Modo desarrollo

Si deseas trabajar en el proyecto y ver los cambios en tiempo real:

```
npm run watch
```

Este comando compilará automáticamente los estilos de Tailwind CSS cada vez que hagas cambios.

## Uso

1. Ingresa la URL del sitio web que deseas analizar
2. Ingresa el XPath para seleccionar los elementos específicos
3. Haz clic en "Realizar Scraping"
4. Verás los resultados extraídos en la sección de resultados

### Ejemplos de XPath

- `//h1` - Selecciona todos los encabezados h1
- `//div[@class="producto"]` - Selecciona todos los divs con la clase "producto"
- `//a/@href` - Selecciona todos los atributos href de los enlaces
- `//table//tr` - Selecciona todas las filas de todas las tablas

## Limitaciones

- Algunos sitios web pueden tener protecciones contra scraping
- Debido a políticas de CORS, se utiliza un proxy (corsproxy.io) para acceder a los sitios web
- El rendimiento puede variar dependiendo del tamaño del sitio web y la complejidad del XPath

## Tecnologías utilizadas

- HTML5
- JavaScript (ES6+)
- [Tailwind CSS](https://tailwindcss.com/)
- [Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)
- [XPath](https://developer.mozilla.org/es/docs/Web/XPath)

## Despliegue en GitHub Pages

Para desplegar este proyecto en GitHub Pages:

1. Sube el código a tu repositorio de GitHub
2. Ve a la configuración del repositorio (Settings)
3. Navega a la sección "Pages"
4. Selecciona la rama (branch) principal en la sección "Source"
5. Haz clic en "Save"

GitHub generará una URL para tu sitio en unos minutos.

## Contribuciones

Las contribuciones son bienvenidas! Si deseas contribuir a este proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Añadir una característica increíble'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.