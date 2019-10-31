<template>
  <div class="layer">
      <div class="typeMarks">
        <div v-for="(type,index) in buildingTypes" :key="'color'+index" class="_mark" :style="{color:type.fill}">{{type.title}}</div>
      </div>
    </div>
</template>

<script>
export default {
  data() {
    return {
      buildingTypes: this.$root.buildingTypes,
    }
  }
}
</script>

<style scoped>
.layer{pointer-events: none;}
.typeMarks{text-align: center;font-size:10px;padding:.5em;}
.typeMarks ._mark{position: relative; display: inline-block;margin:2em 0 0; width:5em;}
.typeMarks ._mark::before{content: "";position: absolute;width:0;height: 0; left: 50%;margin-left: -1em;bottom:100%;border:1em solid;}
</style>
