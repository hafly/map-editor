<template>
    <div id="app" class="flex-row" style="overflow:auto">
        <div class="pr area-wrap oh">

            <!-- svg地图层 -->
            <div class="layer" id="svgElements">
                <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg" @click.self="resetSvg">
                    <template v-for="(item,index) in polygons">
                        <polygon :key="'polygon'+index"
                                 :class="{isBlock: item.block, svgArea: true}"
                                 :style="item.type"
                                 :points="item.points" :data-x="item.attrDataX" :data-y="item.attrDataY" :title="item.attrTitle"
                                 @click="clickElement($event, item)"/>
                    </template>
                </svg>
            </div>
            <!-- 漂浮层 -->
            <div class="layer mapFloat">
                <template v-if="!item.block" v-for="(item,index) in polygons">
                    <span :key="'float'+index" class="_title" :style="{left:item.attrDataX+'px', top:item.attrDataY+'px'}">{{item.attrTitle}}</span>
                </template>
            </div>
            <!-- 路径绘制层 -->
            <div class="layer svgPath" v-if="mode==='路径绘制' || $root.cachePointMode">
                <div class="layer drawPath" @click="drawPath">
                    <div v-for="(item,index) in roads" :key="'showPath'+index">
                        <div class="drawPoint" v-for="(item,drawPoint) in item" :key="'showPathPoint'+drawPoint"
                             :title="'路径'+(index+1)+' '+item.x+','+item.y"
                             :style="{left: item.x+'px', top: item.y+'px'}"
                             :class="{active: !!item.active}"
                             @click.stop="clickPoint(item, index)"
                             @mousedown="startPoint($event, item)"></div>
                    </div>
                </div>
                <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
                    <!-- 已保存的路径 -->
                    <polyline v-for="(item,index) in roads" :key="'showPath'+index"
                              :points="item.map(e=>{return e.x+','+e.y}).join(' ')"
                              :class="{editingPath: true, active:index===$root.currentEditingPathIndex}"/>
                </svg>
            </div>
            <!-- 建筑类型参照 -->
            <typemarks/>

        </div>
        <div class="flex-1" style="margin:20px">
            <importer @importSvg="importSvg" @importMap="importMap" @importPath="importPath"/>

            <el-row :gutter="8">
                <el-col :span="8">
                    <el-radio-group v-model="mode" size="small">
                        <el-radio-button label="编辑地图"></el-radio-button>
                        <el-radio-button label="路径绘制"></el-radio-button>
                    </el-radio-group>
                    <el-button type="warning" size="small" @click="useTest" style="margin-left:10px">体验数据</el-button>
                </el-col>
                <el-col :span="16" class="group-bar-right">
                    <el-button icon="el-icon-download" size="small"><a id="mapDataDownload" download="map.json" target="_blank">保存map.json</a></el-button>
                    <el-button icon="el-icon-download" size="small" :disabled="!roads.length"><a id="pathDataDownload" download="path.json" target="_blank">保存path.json</a></el-button>
                    <el-button type="danger" icon="el-icon-warning" size="small" :disabled="!polygonsBackup || !roadsBackup" @click="resetData">恢复数据</el-button>
                    <el-button type="danger" icon="el-icon-warning" size="small" @click="clearData">清空数据</el-button>
                </el-col>

            </el-row>
            <!-- 地图编辑面板 -->
            <mapediter v-show="mode==='编辑地图'" :polygon="currentPolygon"/>
            <!-- 路线绘制面板 -->
            <roadsediter v-show="mode==='路径绘制' && !$root.cachePointMode" :roads="roads"
                         :roadsCurrentShow="roadsCurrentShow"
                         @savePath="savePath"
                         @update="updatePath"/>
        </div>
    </div>
</template>

<script>
    import * as util from "@/assets/util";
    import * as config from "@/assets/config";
    import instance from "@/api/index";

    let pointMovingCache = {};
    let mouseMoveHandle = function (evt) {
        let point = pointMovingCache.point
        if (point) {

            let xMove = evt.clientX - pointMovingCache.x;
            let yMove = evt.clientY - pointMovingCache.y;
            if (xMove !== 0 || yMove !== 0) {
                point.isMoving = true;
                point.x += xMove;
                point.y += yMove;
                pointMovingCache.x = evt.clientX;
                pointMovingCache.y = evt.clientY;
            }
        }
    };
    let mosueUpHandle = function () {
        document.removeEventListener('mousemove', mouseMoveHandle);
        document.removeEventListener('mouseup', mosueUpHandle);
    }

    export default {
        components: {
            importer: resolve => require(["@/components/importer.vue"], resolve),
            typemarks: resolve => require(["@/components/typeMarks.vue"], resolve),
            mapediter: resolve => require(["@/components/mapediter.vue"], resolve),
            roadsediter: resolve => require(["@/components/roadsediter.vue"], resolve)
        },
        data() {
            return {
                winHeight: null,
                mainDom: null,
                mapDataDownloadDom: null,
                pathDataDownloadDom: null,
                roadsBackup: null,
                polygonsBackup: null,
                polygons: [],
                roads: [],
                currentPolygon: {},
                mode: '编辑地图',
                roadsCurrentShow: undefined
            };
        },
        watch: {
            mode: function () {
                this.resetSvg()
            },
            polygons: {
                handler: function (polygons) {
                    util.session('editing-polygons', polygons);
                    // 保存地图数据
                    if (this.mapDataDownloadDom) {
                        let mapStr = this.polygons.map((e, i) => {
                            if (i === 0) {
                                return '[' + JSON.stringify(e) + ','
                            } else if (i === this.polygons.length - 1) {
                                return JSON.stringify(e) + ']'
                            } else {
                                return JSON.stringify(e) + ','
                            }
                        });
                        var myBlob = new Blob(mapStr, {"type": "application/json"});
                        this.mapDataDownloadDom.href = window.URL.createObjectURL(myBlob);
                    }
                },
                deep: true
            }
        },
        computed: {
            currentPath: function () {
                if (Array.isArray(this.roads) && this.$root.currentEditingPathIndex !== null) {
                    return this.roads[this.$root.currentEditingPathIndex]
                }
            }
        },
        methods: {
            useTest: function () {
                instance.get('static/map.json').then(res => {
                    this.importMap(res.data)
                })
                instance.get('static/path.json').then(res => {
                    this.importPath(res.data)
                })
            },
            startPoint: function (evt, point) {
                pointMovingCache = {
                    x: evt.clientX,
                    y: evt.clientY,
                    point,
                    pointCache: util.deepcopy(point)
                }
                document.addEventListener('mousemove', mouseMoveHandle);
                document.addEventListener('mouseup', mosueUpHandle);
            },
            clickPoint: function (point, roadIndex) {
                if (point.isMoving) {
                    // 拖动点
                    let editingPoint = pointMovingCache.point
                    let pointCache = pointMovingCache.pointCache
                    if (pointCache && pointCache.connect) {
                        //同步数据
                        this.roads.forEach(road => {
                            road.forEach(sp => {
                                if (sp.connect && sp.x === pointCache.x && sp.y === pointCache.y) {
                                    sp.x = editingPoint.x;
                                    sp.y = editingPoint.y;
                                }
                            })
                        })
                    }
                    pointMovingCache = {};
                    delete point.isMoving;
                } else if (this.$root.cachePointMode) {
                    //拾取模式
                    this.currentPolygon.connectPoint = point;
                    if (!point.connectBuildings) {
                        point.connectBuildings = []
                    }
                    let isIn = point.connectBuildings.indexOf(this.currentPolygon.attrTitle);
                    if (isIn < 0) {
                        point.connectBuildings.push(this.currentPolygon.attrTitle)
                    }

                    this.$root.cachePointMode = false;
                    this.savePath();
                } else {
                    // 选取路径
                    if (this.$root.currentEditingPathIndex === null) {
                        this.$root.currentEditingPathIndex = roadIndex
                    }
                    let currentPathIndex = this.currentPath && util.pointInArray(point, this.currentPath);
                    if (point.active) {
                        //取消高亮
                        this.roadsCurrentShow = undefined;
                    } else if (currentPathIndex !== null) {
                        //当前路径节点高亮
                        this.roadsCurrentShow = point;
                    } else {
                        //链接到已保存路径
                        this.roads[this.$root.currentEditingPathIndex].push(point);
                        point.connect = true;
                    }

                }
            },
            breakConnect: function () {
                let isIn = this.currentPolygon.connectPoint.connectBuildings.indexOf(this.currentPolygon.attrTitle);
                if (isIn >= 0) {
                    this.currentPolygon.connectPoint.connectBuildings.splice(isIn, 1);
                }
                delete this.currentPolygon.connectPoint;
            },
            drawPath: function (event) {
                if (pointMovingCache && pointMovingCache.point) {
                    pointMovingCache = {}
                } else {
                    if (this.$root.currentEditingPathIndex === null) {
                        this.roads.push([])
                        this.$root.currentEditingPathIndex = this.roads.length - 1;
                    }
                    this.roads[this.$root.currentEditingPathIndex].push({
                        x: event.offsetX,
                        y: event.offsetY
                    })
                }
            },
            savePath: function () {
                util.session('editing-roads', this.roads);
                // 保存路径数据
                if (this.pathDataDownloadDom) {
                    let blobStr = this.roads.map((e, i) => {
                        if (i === 0) {
                            return '[' + JSON.stringify(e) + ','
                        } else if (i === this.roads.length - 1) {
                            return JSON.stringify(e) + ']'
                        } else {
                            return JSON.stringify(e) + ','
                        }
                    });
                    var myBlob = new Blob(blobStr, {"type": "application/json"});
                    this.pathDataDownloadDom.href = window.URL.createObjectURL(myBlob);
                }
            },
            updatePath: function () {
                this.$nextTick(() => {
                    this.$forceUpdate();
                })
            },
            unchoosePath: function () {
                this.$root.currentEditingPathIndex = null;
            },
            resetData: function () {
                this.resetSvg()
                this.unchoosePath();
                if (Array.isArray(this.polygonsBackup)) {
                    this.polygons = util.deepcopy(this.polygonsBackup);
                }
                if (Array.isArray(this.roadsBackup)) {
                    this.roads = util.deepcopy(this.roadsBackup);
                }
            },
            clearData: function () {
                this.reset();
                this.resetSvg();
                this.unchoosePath();
                this.polygonsBackup = null;
                this.roadsBackup = null;
                this.polygons = [];
                this.roads = [];
            },
            resetSvg: function () {
                this.currentPolygon = {}
                if (this.mainDom) {
                    let actived = this.mainDom.querySelectorAll('polygon.active');
                    actived.forEach(polygon => {
                        polygon.classList.remove('active');
                    })
                }
            },
            clickElement: function (evt, item) {
                this.resetSvg();
                evt.target.classList.add('active');
                this.currentPolygon = item;
            },
            reset: function () {
                this.currentPolygon = {};
                this.$root.currentEditingPathIndex = null
                this.mode = "编辑地图";
                this.roadsCurrentShow = undefined;

            },
            importSvg: function (polygonsArray) {
                this.polygonsBackup = polygonsArray;
                this.polygons = util.deepcopy(this.polygonsBackup);
            },
            importMap: function (mapData) {
                this.reset();
                mapData.forEach(m => {
                    if (!m.connectPoint) {
                        m.connectPoint = {}
                    }
                })
                this.polygonsBackup = mapData;
                this.polygons = util.deepcopy(this.polygonsBackup)
                util.session('editing-polygons', mapData);
            },
            importPath: function (pathData) {
                this.reset();
                this.roadsBackup = pathData;
                this.roads = util.deepcopy(this.roadsBackup)
                util.session('editing-roads', this.roads);
            }
        },
        created: function () {
            // 恢复现场
            let polygons = util.session('editing-polygons');
            if (polygons) {
                this.polygonsBackup = polygons;
                this.polygons = util.deepcopy(this.polygonsBackup)
            }
            let roads = util.session('editing-roads');
            if (roads) {
                this.roadsBackup = roads;
                this.roads = util.deepcopy(this.roadsBackup)
                this.$nextTick(() => {
                    this.savePath()
                })
            }
            //初始化数据
            this.$root.buildingTypes = config.buildingType

        },
        mounted: function () {
            this.mainDom = document.getElementById('svgElements');
            this.mapDataDownloadDom = document.getElementById('mapDataDownload');
            this.pathDataDownloadDom = document.getElementById('pathDataDownload');
        }
    };
</script>

<style>
    @import "assets/common.css";
    /* 图层 */
    .area-wrap {
        position: relative;
        width: 1000px;
        height: 1000px;
        background: #fff;
        border: 1px solid #eee;
    }

    .layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .svgPath {
        background: url(assets/img/boxline.png);
    }

    /* svg地图 */
    .svgArea {
    stroke-width: 0.4px;
    stroke: #ec6707;
    fill: #f8d1b5;
    }
    .svgArea.active {
    stroke: #000 !important;
    stroke-width:1px;
    stroke-dasharray: 10;
    }

    .svgArea.isBlock{
    fill: #ccc !important;
    stroke: #fff !important
    }
    /* 漂浮 */
    .mapFloat {
        background: none;
        pointer-events: none;
        color: #333;
    }

    .mapFloat:empty {
        z-index: -1;
    }

    .mapFloat.handle {
        pointer-events: auto;
    }

    .mapFloat ._title {
        position: absolute;
        transform: translate3d(-2em, -14px, 0);
        pointer-events: none;
        font-size: 10px;
    }

    .mapFloat ._chart {
    position: absolute;
    width: 50px;
    height: 50px;
    transform: translate3d(-32px, -32px, 0);
    }
    .mapFloat ._pin {
    width: 64px;
    height: 64px;
    /*background: url(/public/img/pin.png) center no-repeat;*/
    text-align: center;
    line-height: 64px;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    }
    /* 绘制路径 */
    .drawPoint {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 6px;
        overflow: hidden;
        background: violet;
        transform: translate3d(-3px, -3px, 0);
        cursor: pointer;
    }

    .drawPoint:hover, .drawPoint.active {
        box-shadow: 0 0 4px 4px brown;
    }

    polyline.editingPath {
    fill: none;
    stroke: #ec6707;
    stroke-width: 2px
    }

    polyline.editingPath.active {
    stroke: #49a25a;
    stroke-width: 4px
    }

    .drawPath {
        cursor: crosshair;
    }

    /* 面板 */
    .pathList ._pathtag {
        margin: 0 .5em .5em 0;
        cursor: pointer;
    }

    .group-bar-right {
        text-align: right;
    }

</style>
