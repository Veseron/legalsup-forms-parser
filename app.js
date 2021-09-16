const cheerio = require('cheerio'),
    axios = require('axios'),
    Sitemapper = require('sitemapper');

const siteUrl = 'https://legal-support.ru'
const sitemapUrl = siteUrl + '/sitemap.xml'

const parse = async () => {
    const getSiteUrls = async (url) => {
        try {
            const sitemap = new Sitemapper({
                url,
                timeout: 15000
            })
            const { sites } = await sitemap.fetch()
            return sites
        } catch(err) {
            console.error(err)
        }
    }

    const parsePage = async (url) => {
        try {
            const { data } = await axios.get(url)
            const $ = cheerio.load(data)

            const formsArray = {
                url,
                forms: []
            }

            $('a[href^="/local/ajax/"]').each(async function() {
                // Todo симулировать клик по кнопкам, чтобы подгрузить формы, либо подгрузить их ajax-запросом
                // $(this).trigger('click')
                const href = $(this).attr('href')
                console.log(href)

                if (typeof href === "undefined") {
                    return
                }
                
                try {
                    const { ajaxForm } = await axios.get(siteUrl + href, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    const $_ = cheerio.load(ajaxForm)
                    
                    formsArray.forms.push($_('form').attr('class'))
                } catch(err) {
                    console.error(err)
                }
            })
            $('form').each(function() {
                const pageData = $(this).attr('class')
                formsArray.forms.push(pageData)
            })
            return formsArray
        } catch (err) {
            console.error(err)
        }
    }

    const sitemapArray = await getSiteUrls(sitemapUrl)

    sitemapArray.forEach(async url => {
        const data = await parsePage(url)
        console.log(data)
    });
}

parse()