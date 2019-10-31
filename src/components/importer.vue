<template>
  <el-row :gutter="8">
    <el-col :span="8">
      <el-upload class="myUpload"
        drag
        action=""
        accept="image/svg+xml"
        :before-upload="getFile">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">导入地图svg文件</div>
      </el-upload>
    </el-col>
    <el-col :span="8">
      <el-upload class="myUpload"
        drag
        action=""
        accept="application/json"
        :before-upload="importMap">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">导入地图文件(map.json)</div>
      </el-upload>
    </el-col>
    <el-col :span="8">
      <el-upload class="myUpload"
        drag
        action=""
        accept="application/json"
        :before-upload="importPath">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">导入路径文件(path.json)</div>
      </el-upload>
    </el-col>
  </el-row>
</template>

<script>
import * as util from "@/assets/util";

export default {
  methods: {
    getFile: function(file) {
      util.readLocalFile(file, result => {
        util.loadSvg(result, polygonsArray => {
          this.$emit('importSvg', polygonsArray)
        });
      });
      return false;
    },
    warningTip: function(tips){
      this.$notify({
        title: '警告',
        message: tips,
        type: 'warning'
      });
    }, 
    importMap: function(file){
      util.readLocalFile(file, result => {
        let mapData = result && JSON.parse(result)
        //地图格式校验
        if(Array.isArray(mapData)){
          if(mapData.length && !mapData[0].points){
            return this.warningTip('map.json格式不正确')
          }
        }else{
          return this.warningTip('map.json格式不正确')
        }
        this.$emit('importMap', mapData)
      });
      return false;
    },
    importPath: function(file){
      util.readLocalFile(file, result => {
        let pathData = result && JSON.parse(result)
        //路径格式校验
        if(Array.isArray(pathData)){
          if(pathData.length && !Array.isArray(pathData[0])){
            return this.warningTip('path.json格式不正确')
          }
        }else{
          return this.warningTip('path.json格式不正确')
        }
        this.$emit('importPath', pathData)
      });
      return false;
    }
  }
}
</script>

<style>
.myUpload .el-upload,.myUpload .el-upload-dragger{width:100%;height: 100px;}
.myUpload .el-upload-dragger .el-icon-upload{margin:10px 0 0;}

</style>
