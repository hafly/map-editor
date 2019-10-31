<template>
  <el-form label-width="100px" style="margin:40px 0 0">
    <template v-if="currentPolygon && currentPolygon.points">
      <el-form-item label="标题">
        <el-input v-model="currentPolygon.attrTitle" id="infoInputer"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="currentPolygon.desc" type="textarea"></el-input>
      </el-form-item>
      <el-form-item label="所属类型">
        <el-select v-model="currentPolygon.type" value-key="title" placeholder="请选择">
          <el-option v-for="item in buildingTypes" :key="item.title" :label="item.title" :value="item">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="关联路径节点">
        <el-button :disabled="currentPolygon.block" icon="el-icon-location" circle @click="$root.cachePointMode=true"></el-button>
        <el-button v-show="$root.cachePointMode" @click="$root.cachePointMode=false">退出拾取</el-button>
        <el-button v-show="currentPolygon.connectPoint && currentPolygon.connectPoint.x" @click="breakConnect()">清除关联</el-button>
        <div v-if="currentPolygon.connectPoint && currentPolygon.connectPoint.x">
          {{JSON.stringify(currentPolygon.connectPoint)}}
        </div>
      </el-form-item>
      <el-form-item label="忽略建筑物">
        <el-switch v-model="currentPolygon.block"></el-switch>
      </el-form-item>
      
    </template>

    <template v-else>
      <div>从左侧地图中选择区域，单击进入编辑</div>
    </template>
    
  </el-form>
</template>

<script>

export default {
    props: {
        polygon: {
            type: Object
        }
    },
    data() {
        return {
            buildingTypes: this.$root.buildingTypes,
            currentPolygon: null
        };
    },
    watch: {
      polygon: function(polygon){
        this.currentPolygon = polygon
        this.$nextTick(() => {
          document.getElementById('infoInputer') && document.getElementById('infoInputer').focus()
        })
      }
    },
    methods: {
        
    }
};
</script>

<style scoped></style>
