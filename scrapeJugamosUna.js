import puppeteer from "puppeteer"; //biblioteca scrapping
import fs from 'fs'; //biblioteca filesystem


const scrape = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const allBgames = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage ) {

        //const url = 'https://books.toscrape.com';
        const url = `https://jugamosuna.es/tienda/1639-juegos-de-mesa?page=${currentPage}`;
        //const url = 'https://jugamosuna.es/tienda/2-catalogo?q=Disponibilidad-No+disponible' //No disponible

        await page.goto(url);

        const bgames = await page.evaluate(() => {
            const bgamesElements = document.querySelectorAll('.product_item');
            return Array.from(bgamesElements).map((bgame) => {
                //Título y precio
                const title = bgame.querySelector('h3 a')?.getAttribute('title') || 'Sin titulo';
                const price = bgame.querySelector('.price')?.textContent || 'Precio desconocido';

                // Etiqueta agotado, en este caso comprobando si está el botón de añadir al carrito deshabilitado.
                //TO DO: Ver si está para reservar.
                const outOfStockFlag = bgame.querySelector('.out-stock');
                const addToCartButton = bgame.querySelector('.add-to-cart');
                const availability = outOfStockFlag || (addToCartButton && addToCartButton.disabled) ? 'Agotado' : 'Disponible';

                // Enlace al producto
                const link = bgame.querySelector('.product-title a')?.href || 'No link';

                //EAN y SKU (ideales para luego comparar)
                const sku = bgame.querySelector('meta[itemprop="sku"]')?.getAttribute('content') || 'No SKU';
                const ean = bgame.querySelector('meta[itemprop="ean13"]')?.getAttribute('content') || 'No EAN';
                
            return {title,price, availability, link, sku, ean};
            });
        });

        allBgames.push(...bgames);
        console.log(`Bgames on page ${currentPage}: `, bgames);


        // Buscamos boton siguiente en jugamosuna
        hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a[rel="next"]');
            return nextButton ? true : false;
        });

        currentPage++;
    }
    

    //De momento guardamos a json
    fs.writeFileSync('jugamosuna.json', JSON.stringify(allBgames, null, 2));

    console.log('Datos guardados en bgames.json');

    await browser.close();


};

scrape();