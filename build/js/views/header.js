define(["lodash","backbone","text!html/header.html"],function(t,e,n){return e.View.extend({template:t.template(n),name:"header",events:{"click h1":"onHeaderClick"},render:function(){return this.$el.html(this.template()),this.$instructions=this.$(".header-instructions"),this.$el},toggleInstructions:function(t){this.$instructions.toggleClass("nintja",!t)},onHeaderClick:function(){window.location.hash="#welcome"}})});