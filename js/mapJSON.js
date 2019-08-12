'use strict';

let canvas = document.getElementById("canvasid");//находим canvas по id
let ctx = canvas.getContext("2d"); //включаем 2d графику

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//console.log(canvas);

//описание объекта для управления картой
let mapManager = {

    //свойства объекта
    mapData: null, //переменная для хранения карты
    tLayer: [], //переменная для хранения ссылки на блоки карты
    xCount: 0, //кол-во блоков по горизонтали
    yCount: 0, //кол-во блоков по вертикали
    tSize: {x: 0, y: 0}, //размер блока (x, y)
    mapSize: {x: 0, y: 0}, //размер карты в пикселях(вычисляется) (x, y)
    tilesets: [], //массив описаний блоков карты
    imgLoadCount: 0, //кол-во загруженных изображений
    imgLoaded: false, //загруженны ли все изображения
    jsonLoaded: false, //разобран ли весь json
    veiw: {x: 0, y: 0, width: canvas.width, height: canvas.height},
    numberPlan: 0, //номер плана в tLayer где ходит персонаж

    //методы объекта

    //прогрузка карты
    //-----------------------------------------------------------------------------------------------------------------------
    loadMap(path){//функция для загрузки карты в программу
        let request = new XMLHttpRequest(); //создаем объект ajax запроса

        request.onreadystatechange = () =>{ //будет автоматически вызвана после отправки запроса (вне зависимости от результата)
            if (request.readyState === 4 && request.status === 200){ //информация о готовности ответа && код ответа
                //получен корректный ответ, результат можно обработать
                mapManager.parseMap(request.responseText);
            }
        };
        //this.parseMap()
        request.open("GET", path, true);
        //true - отправляет ассинхронный запрос
        //с использованием функции GET
        request.send();//отправляет запрос
    },

    parseMap(tilesJSON){
        this.mapData = JSON.parse(tilesJSON); //разобрать JSON
        //console.log(this.mapData.tilewidth);
        this.xCount = this.mapData.width; //сохранение ширины
        this.yCount = this.mapData.height; //сохранение высоты

        //сохранение размера блока
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;

        //вычисляем размер карты
        this.mapSize.x = this.xCount * this.tSize.x; //размер карты в пикселях (ширина)
        this.mapSize.y = this.yCount * this.tSize.y; //размер карты в пикселях (высота)

        //настройка видимой зоны
        this.veiw.width = this.mapSize.x;
        this.veiw.height = this.mapSize.y;

        //настройка размера canvas
        canvas.width = this.mapSize.x;
        canvas.height = this.mapSize.y;

        for (let i = 0; i < this.mapData.tilesets.length; i++){ //прогружаем все изображения из которых строится карта

            let img = new Image(); //создаем переменную для хранения изображения
            img.onload = () => { //запуститься при загрузке изображения
                mapManager.imgLoadCount++; //увеличиваем счетчик
                mapManager.imgLoaded = (mapManager.imgLoadCount === this.mapData.tilesets.length);
            };//конец описания функции onload

            let t = this.mapData.tilesets[i]; //забираем tileset из карты
            img.src = "maps/" + t.image; //задание пути к изображению

            let ts = { //создаем свой объект tileset
                firstId: t.firstgid, //с него начинается нумерация в data
                image: img, //объект рисунка
                name: t.name, //имя элемента рисунка
                xCount: Math.floor(t.imagewidth / this.tSize.x), //горизонталь в блоках
                yCount: Math.floor(t.imageheight / this.tSize.y) //вертикаль в блоках
            }; //конц объявления объекта ts

            //console.log(ts);
            //console.log(this.tilesets);
            this.tilesets.push(ts);
        }//окончание цикла for
        this.jsonLoaded = true; //true, разобрали весь json
        //console.log(mapManager.imgLoaded, mapManager.jsonLoaded);
        //console.log(this.mapData.data);
    },
    //-----------------------------------------------------------------------------------------------------------------------

    //прорисовка карты
    //-----------------------------------------------------------------------------------------------------------------------
    draw(ctx){//нарисовать карту в ctx
        //если карта не загружена, то повторить прорисовку через 100 мск
        if (!mapManager.imgLoaded || !mapManager.jsonLoaded){
            //console.log(mapManager.imgLoaded, mapManager.jsonLoaded);
            setTimeout(() =>{mapManager.draw(ctx);}, 100);
        } else {
            if (this.tLayer.length === 0){//проверяем что tLayer настроен
                for (let id = 0; id < this.mapData.layers.length; id++){ //проходим по всем layer карты
                    let layer = this.mapData.layers[id];
                    //console.log(layer.type);
                    if (layer.type === "tilelayer"){ //если не tilelayer пропускаем
                        //console.log(layer);
                        this.tLayer.push(layer);

                        if (layer.name === "main")
                            this.numberPlan = id;
                        // break;
                    }
                }//окончание цикла for
            }
            //console.log(mapManager.tLayer);
            for (let id = 0; id < this.tLayer.length; id++) {
                for (let i = 0; i < this.tLayer[id].data.length; i++) {//пройти по всей карте
                    let a = this.tLayer[id].data[i];
                    if (a !== 0) { //если нет данных пропускаем
                        //console.log(a);
                        let tile = this.getTile(a);//получение блока по индексу
                        //i-проходит линейно по массиву, xCount-длина по x
                        let pX = (i % this.xCount) * this.tSize.x; //вычисляем x в пикселях
                        let pY = Math.floor(i / this.xCount) * this.tSize.y; //вычисяем y в пикселях
                        //рисуем в контексте
                        if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)){//проверка на то что находится ли блок в видимой зоне или нет
                            continue;
                        }
                        //сдвигаем видимую зону
                        pX -= this.veiw.x;
                        pY -= this.veiw.y;
                        ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this
                            .tSize.y);
                    }
                }
            }
        }
    },

    getTile(tileIndex){//индекс блока
        let tile = {//один блок
            img: null, //изображение tileset
            px: 0, py: 0 //координаты блока в tileset
        };
        let tileset = this.getTileset(tileIndex);
        //console.log(tileset);
        tile.img = tileset.image;//изображение искомого tileset
        let id = tileIndex - tileset.firstId;//индекс блока в tileset
        //блок прямоугольный, остаток от деления на xCount дает x в tileset
        let x = id % tileset.xCount;
        //округление от деления дает y в tileset
        let y = Math.floor(id / tileset.xCount);
        //при помощи размеров блоков можем получить координаты блока в пикселях
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        return tile;//возращаем блок для отображения
    },

    getTileset(tileIndex){ //получение блока по индексу
        //console.log(this.tilesets);
        for (let i = this.tilesets.length - 1; i >= 0; i--){
            //в каждом tilesets[i].firstId записанно число с которого начинается нумерация блоков
            //console.log(this.tilesets[i]);
            if (this.tilesets[i].firstId <= tileIndex){//если индекс первого блока меньше или равен искомому значит этот tileset и нужен
                return this.tilesets[i];
            }
        }
        return null; //возращаем найденный tileset
    },

    isVisible(x, y, width, height){//проверка видимости блока
        return !(x + width < this.veiw.x || y + height < this.veiw.y ||
            x > this.veiw.x + this.veiw.width || y > this.veiw.y + this.veiw.height);
    },

    parseEntities(){ //разбор слоя типа objectgroup
        if (!mapManager.imgLoaded || !mapManager.jsonLoaded){
            setTimeout(() => {mapManager.parseEntities();}, 100);
        } else {
            for (let j = 0; j < this.mapData.layers.length; j++){ //просмотр всех слоев
                if (this.mapData.layers[j].type === 'objectgroup'){
                    let entities = this.mapData.layers[j];
                    //слой с объектами следует разобрать
                    for (let i = 0; i < entities.objects.length; i++){
                        let e = entities.objects[i];
                        try {
                            let obj = Object.create(gameManager.factory[e.type]);
                            //в соответствии с типом создаем экземпляр объекта
                            obj.name = e.name;
                            obj.pos_x = e.x;
                            obj.size_x = e.width;
                            obj.size_y = e.height;
                            //помещаем в массив объектов
                            gameManager.entities.push(obj);
                            if (obj.name === "player") {
                                //инициализируем параметры игрока
                                gameManager.initPlayer(obj);
                            }
                        }catch(ex){
                            console.log("Error while creating: [" + e.gid + "]" + e.type + "," + ex); //сообщение об ошибке
                        }
                    }
                }
            }
        }
    },

    getTilesetIdx(x, y){//вычисляет индекс блока в массиве data
        let idx = Math.floor(y / this.tSize.y) * this.xCount + Math.floor(x / this.tSize.x);
        return this.tLayer[this.numberPlan].data[idx];
    }
    //-----------------------------------------------------------------------------------------------------------------------
};

let Player = {
    pos_x: 50, pos_y: 60, // позиция игрока
    size_x: 50, size_y: 37, // размеры игрока
    lifetime: 100, // показатели здоровья
    move_x: 0, move_y: 0, // направление движения
    speed: 10, // скорость объекта

    createPlayer() {
        return Object.create(this);
    },

    draw(ctx) { // прорисовка игрока
        spriteManager.drawSprite(ctx, "adventurer-idle-2-00", this.pos_x, this.pos_y)
    },

    update() { // обновление в цикле
        physicManager.update(this);
    },
    /*
        onTouchEntity(obj) { // обработка встречи с препядствием

        },

        kill() { // уничтожение объекта

        }

     */
};

let spriteManager = { // объект для управления спрайтами
    image: new Image(), // рисунок с объектами
    sprites: [], // массив объктов для отображения
    imgLoaded: false, // изображения загружены
    jsonLoaded: false, // JSON загружен

    loadAtlas(atlasJson, atlasIMG) { // загрузка атласа изображения
        let request = new XMLHttpRequest(); // подготовить запрос на разбор атласа
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText) // успешно получили атлас
            }
        };
        request.open("GET", atlasJson, true); // асинхронный запрос на разбор атласа
        request.send(); // отправили запрос
        this.loadImg(atlasIMG); // загрузка изображения
    },

    loadImg(imgName) { // загрузка изображения
        this.image.onload = function () {
            spriteManager.imgLoaded = true ;// когда изображение загружено, установить в true
        };
        this.image.src = imgName; // загрузка изображения
    },

    parseAtlas(atlasJSON) { // разобрать атлас с объектами
        let atlas = JSON.parse(atlasJSON);
        for (let name in atlas.frames) { // проход по всем именам в frames
            let frame = atlas.frames[name].frame; // получение спрайта и сохранение в frame
            // сохранение характеристик frame в виде объекта
            this.sprites.push({name: name, x: frame.x, y: frame.y, w: frame.w, h: frame.h});
        }
        this.jsonLoaded = true; // true, когда разобрали весь атлас
    },

    drawSprite(ctx, name, x, y) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            // если изображение не загружено, то повторить запрос через 100 мсек
            setTimeout(function () { spriteManager.drawSprite(ctx, name, x, y);}, 100)
        } else {
            let sprite = this.getSprite(name); // получить спрайт по имени
            if (!mapManager.isVisible(x, y, sprite.w, sprite.h))
                return; // не рисуем за пределом видимой зоны
            // отображаем спрайт на холсте
            //console.log(sprite.w, sprite.h);
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h)
        }
    },

    getSprite(name) { // получить объект по имени
        for (let i = 0; i < this.sprites.length; i++) {
            let s = this.sprites[i];
            if (s.name === name)
                return s;
        }
        return null;
    }
};

//менеджер событий
let eventsManager = {
    //свойства
    bind: [], //сопостовления клавиш действиям
    action: [], //действия

    //методы
    setup(){ //настройка клавиш и прявизки
        //настройка привязки к действию
        this.bind['KeyW'] = "up"; //w
        this.bind['KeyA'] = "left"; //a
        this.bind['KeyS'] = "down"; //s
        this.bind['KeyD'] = "right"; //d

        //настраиваем обработчик
        document.body.addEventListener("keydown", this.keyDown);
        document.body.addEventListener("keyup", this.keyUp);
    },

    keyDown(event){ //нажатие клавиши
        let action = eventsManager.bind[event.code]; //получаем действие по коду клавиши
        //console.log(event.code);
        if (action){
            eventsManager.action[action] = true; //согласились выполнить действие
            //console.log(action);
        }
    },

    keyUp(event){ //отпустили клавишу
        let action = eventsManager.bind[event.code]; //получаем действие по коду клавиши

        if (action){
            eventsManager.action[action] = false; //согласились выполнить действие
            //console.log(action);
        }
    }

};

//менеджер физики объектов
let physicManager = {

    //методы
    update(obj){//обновление состояния объекта
        if(obj.move_x === 0 && obj.move_y === 0)
            return 'stop'; //скорость движения нулевая

        //вычисение новых координат
        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);

        //анализ пространства на карте по направлению движения
        let ts = mapManager.getTilesetIdx(newX + obj.size_x, newY + obj.size_y);
        console.log(ts);

        let e = this.entityAtXY(obj, newX, newY); //объект на пути
        /*
        if (e !== null && obj.onTouchEntity) //если есть конфликт (onTouchEnity - функция встречи с другим объектом)
            obj.onTouchEntity(e); //разбор конфликта внутри объекта
        if (ts !== 7 && obj.onTouchMap) //есть припятствие (onTou
            obj.onTouchMap(ts); //разбор конфликта с припятствием внутри объекта

        if (ts === 7 && e === null){ //перемещаем объект на свободное место
            obj.pos_x = newX;
            obj.pos_y = newY;
        } else {
            return "break"; //дальше двигаться нельзя
        }
        */
        obj.pos_x = newX;
        obj.pos_y = newY;
        return "move"; //двигаемся
    },

    entityAtXY(obj, x, y){//определение столкновения объекта по заданным координатам
        for (let i = 0; i < gameManager.entities.length; i++){
            let e = gameManager.entities[i]; //все объекты карты
            if (e.name !== obj.name){ //имя не совпадает (имена уникальны)
                if (x + obj.size_x < e.pos_x || //не пересекаются
                    y + obj.size_y < e.pos_y ||
                    x > e.pos_x + e.size_x ||
                    y > e.pos_y + e.size_y)
                    continue;
                return e; //найден объект
            }
        }
        return null; //объект не найден
    }
};

//менеджер игры
let gameManager = {
    factory: {}, //фабрика объектов на карте
    entities: [], //объекты на карте
    player: null, //указатель на объект игрока
    laterKill: [], //отложенное уничтожение объектов
    initPlayer(obj){ //инициализация игрока
        this.player = obj;
    },
    kill(obj){
        this.laterKill.push(obj);
    },
    draw(ctx){
        for (let e = 0; e < this.entities.length; e++){
            this.entities[e].draw(ctx);
        }
    },
    update(){//обновление информации
        //console.log(this.player);
        if (this.player === null){
            return;
        }
        //по умолчанию игрок никуда не двигается
        this.player.move_x = 0;
        this.player.move_y = 0;

        //поймали событие обрабатываем
        if (eventsManager.action['up']) this.player.move_y = -1;
        if (eventsManager.action['down']) this.player.move_y = 1;
        if (eventsManager.action['left']) this.player.move_x = -1;
        if (eventsManager.action['right']) this.player.move_x = 1;

        //обновление информации по всем объектам на карте
        this.entities.forEach((e) => {
            //console.log(e);
            //try{ //защита от ошибок при выполнении update
            e.update();
            // } catch (ex) {
            //  console.log(-1);
            //}
        });

        //удаление всех объектов, попавших в laterKill
        for (let i = 0; i < this.laterKill.length; i++){
            let idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1)
                this.entities.splice(idx, 1); //удаление из массива 1 объекта
        };

        if (this.laterKill.length > 0) //очистка массива laterKill
            this.laterKill.length = 0;
        mapManager.draw(ctx);
        this.draw(ctx);
    },

    loadAll(){
        mapManager.loadMap("maps/tilemap.json");
        spriteManager.loadAtlas("maps/sprites.json", "maps/spritesheet.png");
        gameManager.factory['Player'] = Player;
        gameManager.entities.push(gameManager.factory['Player']);
        //mapManager.parseEntities();
        eventsManager.setup();
    },

    play(){
        setInterval(updateWorld, 100);
    }
};

const updateWorld = () => {
    gameManager.update();
};

gameManager.loadAll();
gameManager.initPlayer(Player);
gameManager.play();
/*
//eventsManager.setup();
mapManager.loadMap("maps/tilemap.json");
spriteManager.loadAtlas("maps/sprites.json", "maps/spritesheet.png");
mapManager.draw(ctx);

let Player_1 = Player.createPlayer(100);
//let Player_2 = Player.createPlayer(100);

Player_1.pos_x = 50;
Player_1.pos_y = 60;
Player_1.draw(ctx);
*/