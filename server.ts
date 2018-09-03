/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import cheerio from 'cheerio';
import pinyin from 'pinyin';
import sources from './sources.json';

function fetch(source, callback){
    if (source.parser === 'static') {
        return callback(source.targets);
    } else {
        return request(source.url, function(error, response, body){
            let $;
            if (error) { throw error; }
            if (response.statusCode !== 200) { throw response; }

            let result = [];

            if (source.index) {
                $ = cheerio.load(body);
                let remaining = $(source.index).length;
                return $(source.index).each(function(index, element){
                    const new_source = {};
                    for (let key in source) {
                        const value = source[key];
                        new_source[key] = value;
                    }
                    delete new_source.index;
                    new_source.url = url.resolve(source.url, $(element).attr('href'));
                    return fetch(new_source, function(targets){
                        result = result.concat(targets);
                        remaining--;
                        if (remaining <= 0) {
                            return callback(result);
                        }
                    });
                });
            } else {

                switch (source.parser) {
                    case 'lookingglass':
                        $ = cheerio.load(body);
                        var locations = $('p:nth-child(2) b a');
                        var responses = [body];
                        return locations.each((index, element)=>
                            request($(element).attr('href'), function(error, response, body){
                                if (error) { throw error; }
                                if (response.statusCode !== 200) { throw response; }
                                responses.push(body);
                                if (responses.length === (locations.length + 1)) {
                                    responses.forEach(function(body){
                                        $ = cheerio.load(body);
                                        const title = $('p:nth-child(2) b:nth-child(1)').text();
                                        const host = $('#information p:nth-child(1)').text().match(/\d+\.\d+\.\d+\.\d+/)[0];
                                        return result.push({
                                            title,
                                            host
                                        });});
                                    return callback(result);
                                }
                            })
                        );
                    case 'regexp':
                        body.match(new RegExp(source.location, 'g')).forEach(function(matched, index){
                            let title = matched.replace(new RegExp(source.location), '$1');
                            if (source.location_replacements) {
                                for (let pattern in source.location_replacements) {
                                    const replacement = source.location_replacements[pattern];
                                    title = title.replace(new RegExp(pattern, 'g'), replacement);
                                }
                            }
                            if (result[index] == null) { result[index] = {}; }
                            return result[index].title = title;
                        });
                        body.match(new RegExp(source.host, 'g')).forEach(function(matched, index){
                            let host = matched.replace(new RegExp(source.host, 'g'), '$1');
                            if (source.host_replacements) {
                                for (let pattern in source.host_replacements) {
                                    const replacement = source.host_replacements[pattern];
                                    host = host.replace(new RegExp(pattern, 'g'), replacement);
                                }
                            }
                            if (result[index] == null) { result[index] = {}; }
                            return result[index].host = host;
                        });
                        return callback(result);
                    default:
                        $ = cheerio.load(body);
                        $(source.location).each(function(index, element){
                            if (source.location_replacements) {
                                for (let pattern in source.location_replacements) {
                                    const replacement = source.location_replacements[pattern];
                                    element = $(element).html().replace(new RegExp(pattern, 'g'), replacement);
                                }
                            }
                            const title = $(element).text().replace(/^\s+|\s+$/g, '');
                            if (result[index] == null) { result[index] = {}; }
                            return result[index].title = title;
                        });
                        $(source.host).each(function(index, element){
                            if (source.host_replacements) {
                                for (let pattern in source.host_replacements) {

                                    const replacement = source.host_replacements[pattern];
                                    element = $(element).html().replace(new RegExp(pattern, 'g'), replacement);
                                }
                            }
                            const host = $(element).text().replace(/^\s+|\s+$/g, '');
                            if (result[index] == null) { result[index] = {}; }
                            return result[index].host = host;
                        });
                        return callback(result);
                }
            }
        });
    }
};


sources.forEach(source=>
    fetch(source, function(result){
        console.log(`+ ${source.title.replace(/[\u4e00-\u9fa5]+/g, word=> [''].concat(pinyin(word, {segment: {truent: true, style: pinyin.STYLE_NORMAL}}), '').join('_')).replace(/[^\w\u4e00-\u9fa5]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`);
        console.log(`menu = ${source.title}`);
        console.log(`title = ${source.title}`);
        if (process.env.slaves) {
            console.log("nomasterpoll = yes");
        }
        if (source.extra) {
            for (let key in source.extra) {
                const value = source.extra[key];
                console.log(`${key} = ${value}`);
            }
        }
        console.log("");
        return (() => {
            const result1 = [];
            for (let target of result) {
                if (!source.excludes || !source.excludes.includes(target.host)) {
                    console.log(`++ ${target.title.replace(/[\u4e00-\u9fa5]+/g, word=> [''].concat(pinyin(word, {segment: true, style: pinyin.STYLE_NORMAL}), '').join('_')).replace(/[^\w\u4e00-\u9fa5]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`);
                    console.log(`menu = ${target.title}`);
                    console.log(`title = ${target.title}`);
                    console.log(`host = ${target.host}`);
                    if (process.env.slaves) {
                        console.log(`slaves = ${process.env.slaves}`);
                    }
                    result1.push(console.log(""));
                } else {
                    result1.push(undefined);
                }
            }
            return result1;
        })();
    })
);
