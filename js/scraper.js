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
                throw new Error(`No se pudo acceder a la URL a través de ningún proxy. Último error: ${lastError ? lastError.message : 'Desconocido'}`);
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
            noResultsEl.className = 'text-gray-500 italic';
            noResultsEl.textContent = 'No se encontraron elementos que coincidan con el XPath proporcionado.';
            resultsList.appendChild(noResultsEl);
        } else {
            // Crear elementos para cada resultado
            results.forEach((result, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'p-3 bg-gray-50 rounded-md';
                
                const header = document.createElement('div');
                header.className = 'flex justify-between items-center mb-2';
                
                const title = document.createElement('h3');
                title.className = 'text-sm font-semibold';
                title.textContent = `Resultado #${index + 1} - ${result.nodeType}`;
                
                header.appendChild(title);
                resultItem.appendChild(header);
                
                // Añadir información según el tipo de nodo
                if (result.nodeType === 'Element') {
                    const tagInfo = document.createElement('p');
                    tagInfo.className = 'text-xs text-gray-500 mb-2';
                    tagInfo.textContent = `Tag: ${result.tagName}`;
                    resultItem.appendChild(tagInfo);
                    
                    if (result.textContent) {
                        const textContent = document.createElement('div');
                        textContent.className = 'mb-2';
                        const textLabel = document.createElement('span');
                        textLabel.className = 'text-xs font-medium text-gray-600';
                        textLabel.textContent = 'Texto: ';
                        textContent.appendChild(textLabel);
                        
                        const textValue = document.createElement('span');
                        textValue.className = 'text-sm';
                        textValue.textContent = result.textContent.length > 100 
                            ? result.textContent.substring(0, 100) + '...' 
                            : result.textContent;
                        textContent.appendChild(textValue);
                        
                        resultItem.appendChild(textContent);
                    }
                    
                    // Código HTML
                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'mt-2';
                    
                    const codeLabel = document.createElement('span');
                    codeLabel.className = 'text-xs font-medium text-gray-600 block mb-1';
                    codeLabel.textContent = 'HTML:';
                    codeContainer.appendChild(codeLabel);
                    
                    const code = document.createElement('pre');
                    code.className = 'bg-gray-100 p-2 rounded text-xs overflow-x-auto';
                    
                    // Limitar el tamaño del HTML mostrado
                    const htmlContent = result.content.length > 300 
                        ? result.content.substring(0, 300) + '...' 
                        : result.content;
                    
                    code.textContent = htmlContent;
                    codeContainer.appendChild(code);
                    
                    resultItem.appendChild(codeContainer);
                } else if (result.nodeType === 'Text') {
                    const textContent = document.createElement('p');
                    textContent.className = 'text-sm';
                    textContent.textContent = result.content;
                    resultItem.appendChild(textContent);
                } else if (result.nodeType === 'Attribute') {
                    const attrInfo = document.createElement('p');
                    attrInfo.className = 'text-sm';
                    attrInfo.innerHTML = `<span class="font-medium">${result.name}</span>: ${result.value}`;
                    resultItem.appendChild(attrInfo);
                }
                
                resultsList.appendChild(resultItem);
            });
        }
        
        // Mostrar contenedor de resultados
        resultsContainer.classList.remove('hidden');
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