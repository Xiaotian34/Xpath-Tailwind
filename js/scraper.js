document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scraperForm');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultContainer');
    const errorContainer = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const resultCount = document.getElementById('resultCount');
    const resultsList = document.getElementById('results');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Recoger los valores del formulario
        const url = document.getElementById('url').value;
        const xpath = document.getElementById('xpath').value;
        
        // Reiniciar el estado
        hideResults();
        showLoading();
        
        try {
            // Intentar realizar el scraping
            const results = await performScraping(url, xpath);
            displayResults(results);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    });

    async function performScraping(url, xpath) {
        try {
            // Lista de servicios proxy para intentar en caso de fallo
            const proxyServices = [
                // AllOrigins - JSON formateado
                async (url) => {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) {
                        throw new Error(`Error al obtener la página: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    return data.contents;
                },
                // Codetabs - formato texto
                async (url) => {
                    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) {
                        throw new Error(`Error al obtener la página: ${response.status} ${response.statusText}`);
                    }
                    return await response.text();
                },
                // Corsproxy - formato texto
                async (url) => {
                    const proxyUrl = `https://corsproxy.org/?${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`Error al obtener la página: ${response.status} ${response.statusText}`);
                    }
                    return await response.text();
                }
            ];
            
            // Intentamos diferentes proxies hasta que uno funcione
            let lastError = null;
            let html = null;
            
            for (const proxyService of proxyServices) {
                try {
                    console.log(`Intentando obtener ${url} a través de un proxy...`);
                    html = await proxyService(url);
                    console.log('Proxy exitoso, contenido obtenido');
                    // Si llegamos aquí, el proxy funcionó
                    break;
                } catch (error) {
                    lastError = error;
                    console.warn(`Un proxy falló, probando el siguiente... (${error.message})`);
                    continue; // Intentar con el siguiente proxy
                }
            }
            
            // Si después de intentar todos los proxies, el HTML sigue siendo null
            if (html === null) {
                throw new Error(`No se pudo acceder a la URL. Último error: ${lastError ? lastError.message : 'Desconocido'}`);
            }
            
            // Crear un documento HTML a partir del texto HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Aplicar el XPath al documento
            const result = document.evaluate(
                xpath,
                doc,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            
            // Extraer los resultados
            const results = [];
            for (let i = 0; i < result.snapshotLength; i++) {
                const node = result.snapshotItem(i);
                
                // Dependiendo del tipo de nodo, extraer la información relevante
                if (node.nodeType === Node.ELEMENT_NODE) {
                    results.push({
                        nodeType: 'Element',
                        tagName: node.tagName,
                        content: node.outerHTML,
                        textContent: node.textContent.trim()
                    });
                } else if (node.nodeType === Node.TEXT_NODE) {
                    results.push({
                        nodeType: 'Text',
                        content: node.textContent.trim()
                    });
                } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    results.push({
                        nodeType: 'Attribute',
                        name: node.name,
                        value: node.value
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error en scraping:', error);
            throw error;
        }
    }

    function displayResults(results) {
        // Limpiar resultados anteriores
        resultsList.innerHTML = '';
        
        // Actualizar contador
        resultCount.textContent = `Se encontraron ${results.length} elementos`;
        
        if (results.length === 0) {
            const noResultsEl = document.createElement('div');
            noResultsEl.className = 'text-gray-500 text-sm animate-fade-in';
            noResultsEl.textContent = 'No se encontraron elementos que coincidan con el XPath proporcionado.';
            resultsList.appendChild(noResultsEl);
        } else {
            // Crear elementos para cada resultado
            results.forEach((result, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'p-3 bg-gray-700 rounded transition-all duration-300 hover:bg-gray-600 animate-slide-up';
                // Añadir un retraso basado en el índice para crear efecto escalonado
                resultItem.style.animationDelay = `${index * 50}ms`;
                
                const header = document.createElement('div');
                header.className = 'mb-2';
                
                const title = document.createElement('h3');
                title.className = 'text-sm font-medium text-blue-300';
                title.textContent = `${result.nodeType}`;
                
                header.appendChild(title);
                resultItem.appendChild(header);
                
                // Añadir información según el tipo de nodo
                if (result.nodeType === 'Element') {
                    const tagInfo = document.createElement('p');
                    tagInfo.className = 'text-xs text-gray-400 mb-2';
                    tagInfo.textContent = `Tag: ${result.tagName}`;
                    resultItem.appendChild(tagInfo);
                    
                    // Mostrar imagen si el elemento es una imagen
                    if (result.tagName === 'IMG') {
                        // Extraer el atributo src utilizando expresiones regulares
                        const srcMatch = result.content.match(/src=["'](.*?)["']/i);
                        if (srcMatch && srcMatch[1]) {
                            const imgContainer = document.createElement('div');
                            imgContainer.className = 'mb-4 mt-2 text-center';
                            
                            const imgPreview = document.createElement('img');
                            const srcUrl = srcMatch[1];
                            // Comprobar si es una URL relativa o absoluta
                            const imgSrc = srcUrl.startsWith('http') ? 
                                srcUrl : 
                                (srcUrl.startsWith('/') ? 
                                    new URL(document.getElementById('url').value).origin + srcUrl : 
                                    new URL(document.getElementById('url').value).origin + '/' + srcUrl);
                            
                            imgPreview.src = imgSrc;
                            imgPreview.alt = 'Vista previa de imagen';
                            imgPreview.className = 'max-w-full max-h-48 rounded border border-gray-600 shadow-lg animate-fade-in transition-transform duration-300 hover:scale-105';
                            imgPreview.onerror = function() {
                                this.onerror = null;
                                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJkM2E0ZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                this.className = 'max-w-full max-h-48 rounded border border-gray-600 opacity-50';
                            };
                            imgContainer.appendChild(imgPreview);
                            resultItem.appendChild(imgContainer);
                        }
                    }
                    
                    if (result.textContent && result.tagName !== 'IMG') {
                        const textContent = document.createElement('div');
                        textContent.className = 'mb-2';
                        
                        const textValue = document.createElement('p');
                        textValue.className = 'text-sm text-gray-300';
                        textValue.textContent = result.textContent.length > 100 
                            ? result.textContent.substring(0, 100) + '...' 
                            : result.textContent;
                        textContent.appendChild(textValue);
                        
                        resultItem.appendChild(textContent);
                    }
                    
                    // Botón para expandir/colapsar el código HTML
                    const toggleButton = document.createElement('button');
                    toggleButton.className = 'text-xs text-blue-400 hover:text-blue-300 transition-colors mb-2';
                    toggleButton.textContent = 'Mostrar HTML';
                    toggleButton.onclick = function() {
                        if (codeContainer.classList.contains('hidden')) {
                            codeContainer.classList.remove('hidden');
                            codeContainer.classList.add('animate-fade-in');
                            this.textContent = 'Ocultar HTML';
                        } else {
                            codeContainer.classList.add('hidden');
                            this.textContent = 'Mostrar HTML';
                        }
                    };
                    resultItem.appendChild(toggleButton);
                    
                    // Código HTML (oculto por defecto)
                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'mt-2 text-xs hidden';
                    
                    const code = document.createElement('pre');
                    code.className = 'bg-gray-800 p-2 rounded overflow-x-auto text-gray-400 text-xs';
                    
                    // Limitar el tamaño del HTML mostrado
                    const htmlContent = result.content.length > 300 
                        ? result.content.substring(0, 300) + '...' 
                        : result.content;
                    
                    code.textContent = htmlContent;
                    codeContainer.appendChild(code);
                    
                    resultItem.appendChild(codeContainer);
                } else if (result.nodeType === 'Text') {
                    const textContent = document.createElement('p');
                    textContent.className = 'text-sm text-gray-300';
                    textContent.textContent = result.content;
                    resultItem.appendChild(textContent);
                } else if (result.nodeType === 'Attribute') {
                    const attrInfo = document.createElement('p');
                    attrInfo.className = 'text-sm text-gray-300';
                    attrInfo.innerHTML = `<span class="text-blue-300">${result.name}</span>: ${result.value}`;
                    resultItem.appendChild(attrInfo);
                }
                
                resultsList.appendChild(resultItem);
            });
        }
        
        // Mostrar contenedor de resultados con animación
        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('animate-fade-in');
    }

    function showLoading() {
        loadingIndicator.classList.remove('hidden');
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    function hideResults() {
        resultsContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
    }
});