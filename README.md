## WeebAPI
WeebAPI is a NodeJS implementation aimed to parse and serve manga from a plethora of websites.  

## Description
This api can parse webpages on the fly and give you clean JSON in return.
Some of these websites are:
- [mangakakalot](https://mangakakalot.com/)
- [mangadex](https://mangadex.org/)
- [mnagasushi](https://mangasushi.net/)
- [readm](https://readm.org/)

These scrapers are very easy to add and will all be open source.

Accompanying this API are frontends for windows, linux, osx, android and ios. 

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Requirements
Latest NodeJS version with NPM or Yarn.
## Installation
```properties
cd backend
yarn install
# or
npm install
```

## Usage
In the following examples yarn can be replaced with npm.

Start the built api
```properties
cd backend
yarn run build
yarn start
```

### Development
```properties
yarn run dev
```

## API Documentation
Swagger IO

## Roadmap
Will be adding a lot more plugins to support as many websites as possible.
As of right now, all plugins rely on the content being inside of the HTML received when a GET request is done to the page, but some manga hosting websites have it setup so that you need to have their scripts load the page after you've GET-requested the page.

They do this to combat any scrapers like this.
This can be easily bypassed by using a headless browser such as Puppeteer.
## Contributing
Plugins can be contributed, but have to have their own jest tests and of course they should pass. These tests are a necessity because manga sites keep changing their DOM content so the plugins will stop working at some point. The tests can quickly show which plugins don't work and which do.

```properties
yarn jest --rootDir ./specs [spec filename]
# or
npx jest --rootDir ./specs [spec filename]
```

## License
```
Copyright 2015 Javier Tomás

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## Project status
This is just a side project of mine so there's not much activity other than the occasional weekend that I'm working on it.