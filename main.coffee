request = require('request')
cheerio = require('cheerio')
sources = require './sources.json'

fetch = (source, callback)->
  request source.url, (error, response, body)->
    throw error if error
    throw response unless response.statusCode == 200

    result = []
    switch source.parser
      when 'lookingglass'
        $ = cheerio.load(body)
        locations = $('p:nth-child(2) b a')
        responses = [body]
        locations.each (index, element)->
          request $(element).attr('href'), (error, response, body)->
            throw error if error
            throw response unless response.statusCode == 200
            responses.push body
            if responses.length == locations.length + 1
              responses.forEach (body)->
                $ = cheerio.load(body)
                title = $('p:nth-child(2) b:nth-child(1)').text()
                id = title.replace(/\W+/g, '_').replace(/^_+|_+$/g, '');
                host = $('#information p:nth-child(1)').text().match(/\d+\.\d+\.\d+\.\d+/)[0]
                result.push {
                  id: id
                  title: title
                  host: host
                }
              callback result
      when 'regexp'
        body.match(new RegExp(source.location, 'g')).forEach (matched, index)->
          title = matched.replace(new RegExp(source.location), '$1')
          if source.location_replacements
            for pattern, replacement of source.location_replacements
              title = title.replace(new RegExp(pattern, 'g'), replacement)
          id = title.replace(/\W+/g, '_').replace(/^_+|_+$/g, '');
          result[index] ?= {}
          result[index].id = id
          result[index].title = title
        body.match(new RegExp(source.host, 'g')).forEach (matched, index)->
          host = matched.replace(new RegExp(source.host, 'g'), '$1')
          if source.host_replacements
            for pattern, replacement of source.host_replacements
              host = host.replace(new RegExp(pattern, 'g'), replacement)
          result[index] ?= {}
          result[index].host = host
        callback(result)
      else
        $ = cheerio.load(body);
        $(source.location).each (index, element)->
          if source.location_replacements
            for pattern, replacement of source.location_replacements
              element = $(element).html().replace(new RegExp(pattern, 'g'), replacement)
          title = $(element).text().replace(/^\s+|\s+$/g, '');
          id = title.replace(/\W+/g, '_').replace(/^_+|_+$/g, '');
          result[index] ?= {}
          result[index].id = id
          result[index].title = title
        $(source.host).each (index, element)->
          if source.host_replacements
            for pattern, replacement of source.host_replacements

              element = $(element).html().replace(new RegExp(pattern, 'g'), replacement)
          host = $(element).text().replace(/^\s+|\s+$/g, '');
          result[index] ?= {}
          result[index].host = host
        callback(result)



sources.forEach (source)->
  fetch source, (result)->
    console.log "+ #{source.id}"
    console.log "menu = #{source.title}"
    console.log "title = #{source.title}"
    console.log "nomasterpoll = yes"
    console.log ""
    for target in result
      unless source.excludes and target.host in source.excludes
        console.log "++ #{target.id}"
        console.log "menu = #{target.title}"
        console.log "title = #{target.title}"
        console.log "host = #{target.host}"
        console.log "slaves = railgun1 railgun2 railgun3"
        console.log ""