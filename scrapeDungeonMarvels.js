import puppeteer from "puppeteer"; // Biblioteca para scraping
import fs from 'fs'; // Biblioteca para manejo del sistema de archivos


const scrape = async () => {
    //Abrimos navegador y pagina
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //Para optimizar, vamos a evitar que cargue recursos innecesarios.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort(); // Cancelar carga de recursos no esenciales
        } else {
        req.continue(); // Continuar con otros recursos
        }
    });


    const allBgames = [];
    let currentPage = 1;
    let hasNextPage = true;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (hasNextPage) {
        const url = `https://dungeonmarvels.com/10-juegos-de-tablero?page=${currentPage}`;
        await page.goto(url);

        console.log(url);

        // Buscamos ya el botón de Next Page, puesto que el script entrará en los productos.
        hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a[rel="next"]');
            return nextButton ? true : false;
            
        });

        // Extraemos los enlaces a las páginas de productos dentro del div con ID 'js-products-list'
        const productLinks = await page.evaluate(() => {
            // Seleccionamos el contenedor específico de productos usando ID
            const productContainer = document.getElementById('js-product-list');

            // Asegurarnos de que el contenedor existe
            if (!productContainer) return [];

            // Seleccionamos todos los elementos 'article' con la clase 'product-miniature' dentro de este contenedor
            const products = Array.from(productContainer.querySelectorAll('article.product-miniature'));

            // Obtenemos los enlaces de los productos
            return products.map(product => {
                const linkElement = product.querySelector('.product-title a');
                return linkElement ? linkElement.href : null;
            }).filter(link => link !== null); // Eliminamos posibles enlaces nulos
        });

        // Navegar a cada página de producto para extraer más información
        for (let productLink of productLinks) {
            await page.goto(productLink);  // Navegamos a la página específica del producto


            // Extraer los datos que necesitamos de la página individual del producto
            const productData = await page.evaluate(() => {
                const title = document.querySelector('.product-title')?.innerText || 'Sin título';
                const price = document.querySelector('.price')?.innerText || 'Sin precio';
                const ean = document.querySelector('span[itemprop="gtin13"]')?.innerText || 'Sin EAN';
                const sku = document.querySelector('span[itemprop="sku"]')?.innerText || 'Sin SKU';

            // Verificamos la disponibilidad basado en las clases CSS
                const availabilityTag = document.querySelector('#product-availability');
                let availability = 'Desconocido';
                
                if (availabilityTag) {
                    if (availabilityTag.querySelector('.stock-tag.disponible.shown')) {
                        availability = 'Disponible';
                    } else if (availabilityTag.querySelector('.stock-tag.reserva.shown')) {
                        availability = 'En reserva';
                    } else if (availabilityTag.querySelector('.stock-tag.agotado.shown')) {
                        availability = 'Agotado';
                    }
                }

                return { title, price, ean, sku, availability};
            });

            //Como no podemos acceder al link desde dentro de evaluate lo añadimos ahora
            const link = page.url();
            productData.link = link;

            allBgames.push(productData);
            console.log(`Datos del producto: `, productData);
        }

        
        currentPage++;
        await delay(3000); // 3 segundos de retraso
    }

    // Guardar los datos en un archivo JSON
    fs.writeFileSync('dungeonmarvels.json', JSON.stringify(allBgames, null, 2));

    console.log('Datos guardados en dungeonmarvels.json');

    await browser.close();
};

scrape();