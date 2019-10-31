import Vue from 'vue'

export const readLocalFile = function (file, callback) {
    var reader = new FileReader();
    //将文件以文本形式读入页面
    reader.readAsText(file);
    reader.onload = function () {
        typeof callback === 'function' && callback(this.result)
    }
}

//深拷贝
export const deepcopy = function (source) {
    if (!source) {
        return source;
    }
    let sourceCopy = source instanceof Array ? [] : {};
    for (let item in source) {
        sourceCopy[item] = typeof source[item] === 'object' ? deepcopy(source[item]) : source[item];
    }
    return sourceCopy;
};
//sessionStorage
export const session = function(key, value){
    if (value === void(0)) {
        var lsVal = sessionStorage.getItem(key);
        if(lsVal && lsVal.indexOf('autostringify-') === 0 ){
            return JSON.parse(lsVal.split('autostringify-')[1]);
        }else{
            return lsVal;
        }
    }else {
        if (typeof(value)==="object" || Array.isArray(value)) {
            value = 'autostringify-' + JSON.stringify(value);
        }
        return sessionStorage.setItem(key, value);
    }
}
// 解析svg
export const loadSvg = function(svgString, callback){
    let polygonsArray = [];
    let pattern = /<polygon([^<]+)\/>/g;
    let polygons = svgString.match(pattern);
    if (!polygons.length) {
        Vue.$notify({
            title: '警告',
            message: 'svg文件异常',
            type: 'warning'
        });
    }

    polygons.forEach(function(svgElement) {
        let regPoint = /points="([^"]+)"/g;
        let regAttrTitle = /title="([^"]+)"/g;
        let regAttrDataX = /data-x="([^"]+)"/g;
        let regAttrDataY = /data-y="([^"]+)"/g;
        // 提取信息
        let points = regPoint.exec(svgElement);
        let attrTitle = regAttrTitle.exec(svgElement);
        let attrDataX = regAttrDataX.exec(svgElement);
        let attrDataY = regAttrDataY.exec(svgElement);
        if (points === null) {
            return new Error('polygon without prop "points"');
        } else {
            points = (points[1]).trim().split(' ').map(e=>{
                return e.trim().replace(/\\r\\n\\t/g,"")
            }).join(' ');
        }
        let pointsArray = points
            .trim()
            .split(" ")
            .map(p => {
                return p
                    .trim()
                    .split(",")
                    .join(" ");
            });

        if (attrTitle === null) {
            attrTitle = "未命名";
        } else {
            attrTitle = attrTitle[1];
        }
        if (attrDataX === null || attrDataY === null) {
            // 计算中心点
            let xqueue = [];
            let yqueue = [];
            let xMax, yMax, xMin, yMin;
            pointsArray.forEach(e => {
                let point = e.split(" ");
                xqueue.push(point[0]);
                yqueue.push(point[1]);
            });
            xMax = Math.max.apply(null, xqueue);
            yMax = Math.max.apply(null, yqueue);
            xMin = Math.min.apply(null, xqueue);
            yMin = Math.min.apply(null, yqueue);
            pointsArray = pointsArray.map(p => {
                p = p.split(" ").map(ps => {
                    return ps + "px";
                });
                return p.join(" ");
            });
            attrDataX = parseInt((xMax + xMin) / 2);
            attrDataY = parseInt((yMax + yMin) / 2);
        } else {
            attrDataX = attrDataX[1];
            attrDataY = attrDataY[1];
        }

        polygonsArray.push({
            points,
            attrDataX,
            attrDataY,
            attrTitle,
            connectPoint: {}
        });
    });

    typeof callback === 'function' && callback(polygonsArray)
}
// 点是否在队列中
export const pointInArray = function(point, array){
    let isIn = null;
    for(let i = 0;i<array.length;i++){
        let thePoint = array[i];
        if((thePoint.x === point.x) && (thePoint.y === point.y)){
            isIn = i;
            break;
        }
    }
    return isIn
}
let bus = new Vue();
//监听事件
export const on = function (eventName, eventHandle) {
    if (eventName && (typeof eventHandle === 'function'))
        return bus.$once(eventName, eventHandle)
};
//触发事件
export const emit = function (eventName, msg) {
    return bus.$emit(eventName, msg)
};