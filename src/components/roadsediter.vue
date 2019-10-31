<template>
  <div>
    <!-- 已保存路径 -->
    <div class="m pathList">
      <el-tag v-for="(item,index) in roads" :key="'road'+index" class="_pathtag" :type="index === $root.currentEditingPathIndex ? 'success' : 'info'" @click.native="choosePath(index)">路径{{index+1}}</el-tag>
    </div>
    <!-- 当前路径 -->
    <el-table ref="currentRoadsPointsTable" style="width: 100%" empty-text="在左侧地图上开始绘制" 
      :height="winHeight-360" 
      :data="currentPath" 
      :highlight-current-row="true" 
      @current-change="triggerCurrentFromTable">
      <el-table-column type="index" width="50"></el-table-column>
      <el-table-column label="坐标" width="150">
        <template slot-scope="scope">
          X: {{scope.row.x}} Y: {{scope.row.y}}
        </template>
      </el-table-column>
      <el-table-column label="关联建筑">
        <template slot-scope="scope">
          <div v-if="scope.row.connectBuildings">
            {{scope.row.connectBuildings.join('、')}}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" align="center">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="insertPoint(scope.$index, -1)">前添加</el-button>
          <el-button type="primary" size="mini" @click="insertPoint(scope.$index, 1)">后添加</el-button>
          <el-button type="danger" size="mini" @click="deleteCurrentPathPoint(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="tc m">
      <el-button type="primary" :disabled="!currentPath || !currentPath.length" @click="addPath">保存路径</el-button>
      <el-button :disabled="!currentPath || !currentPath.length" @click="clearPath">清除节点</el-button>
      <el-button type="danger" :disabled="!$root.currentEditingPathIndex" @click="deletePath($root.currentEditingPathIndex)">删除路径</el-button>
    </div>
  </div>
</template>

<script>
import * as util from "@/assets/util";

export default {
    props: {
        roads: {
            type: Array
        },
        roadsCurrentShow: {
          default: undefined
        }
    },
    data() {
        return {
            winHeight: null
        };
    },
    watch: {
        roadsCurrentShow: function(roadsCurrentShow) {
            this.$refs.currentRoadsPointsTable.setCurrentRow(roadsCurrentShow);
        }
    },
    computed: {
        currentPath: function() {
            if (Array.isArray(this.roads)) {
                return this.roads[this.$root.currentEditingPathIndex];
            }
        }
    },
    methods: {
        triggerCurrentFromTable: function(currentRow, prevCurrent) {
            if (currentRow) {
                currentRow.active = true;
            }
            if (prevCurrent) {
                delete prevCurrent.active;
            }
            this.$emit('update')
        },

        insertPoint: function(index, place) {
            let thePoint = this.currentPath[index];
            let targetPoint;
            let newPoint;
            let insertIndex;
            if (place < 0) {
                if (index > 0) {
                    targetPoint = this.currentPath[index - 1];
                } else {
                    let nextPoint = this.currentPath[index + 1];
                    let distance = {
                        x: thePoint.x - nextPoint.x,
                        y: thePoint.y - nextPoint.y
                    };
                    targetPoint = {
                        x: thePoint.x + distance.x,
                        y: thePoint.y + distance.y
                    };
                }

                insertIndex = index;
            } else {
                if (index === this.currentPath.length - 1) {
                    let prevPoint = this.currentPath[index - 1];
                    let distance = {
                        x: thePoint.x - prevPoint.x,
                        y: thePoint.y - prevPoint.y
                    };
                    targetPoint = {
                        x: thePoint.x + distance.x,
                        y: thePoint.y + distance.y
                    };
                } else {
                    targetPoint = this.currentPath[index + 1];
                }

                insertIndex = index + 1;
            }

            newPoint = {
                x: parseInt((thePoint.x + targetPoint.x) / 2),
                y: parseInt((thePoint.y + targetPoint.y) / 2)
            };

            this.roads[this.$root.currentEditingPathIndex].splice(insertIndex, 0, newPoint);
        },
        deleteCurrentPathPoint: function(index) {
            this.roads[this.$root.currentEditingPathIndex].splice(index, 1);
        },
        addPath: function() {
            if (this.$root.currentEditingPathIndex) {
                this.roads.splice(
                    this.$root.currentEditingPathIndex,
                    1,
                    util.deepcopy(this.currentPath)
                );
            } else {
                this.roads.push(util.deepcopy(this.currentPath));
            }
            this.$root.currentEditingPathIndex = null;
            this.savePath();
        },
        clearPath: function() {
          this.$set(this.roads, this.$root.currentEditingPathIndex, [])
        },
        deletePath: function(index) {
            this.$confirm("删除路径" + (index + 1) + "?", "提示", {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning"
            }).then(() => {
                this.$root.currentEditingPathIndex = null;
                this.roads.splice(index, 1);
                this.savePath();
            });
        },
        unchoosePath: function() {
            this.$root.currentEditingPathIndex = null;
        },
        choosePath: function(index) {
            if (this.$root.currentEditingPathIndex === index) {
                return this.unchoosePath();
            }
            this.$root.currentEditingPathIndex = index;
        },
        savePath: function() {
            this.$emit("savePath");
        }
    },
    mounted: function() {
        this.winHeight = window.innerHeight;
    }
};
</script>

<style scoped>
.typeMarks {
    text-align: center;
    font-size: 10px;
    padding: 0.5em;
}
.typeMarks ._mark {
    position: relative;
    display: inline-block;
    margin: 2em 0 0;
    width: 5em;
}
.typeMarks ._mark::before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    margin-left: -1em;
    bottom: 100%;
    border: 1em solid;
}
</style>
