//defino el ancho del contenedor de mapa principal
var width = 1100,
    height = 800,
    centered;


//Esta variable es un objeto que me asocia el id de cada pais con los datos asociados
var rateById = d3.map();

//genero rangos con string para definir los distinto estilos-color que toma cada departamento dependiendo del % de abstencinismo, el minimo valor que se tiene es de 30%-claros el máximo es 100%-oscuros
var quantize = d3.scale.quantize()
    .domain([0, 5])
    .range(d3.range(6).map(function(i) { return "q" + i + "-9"; }));
//genero el contenedor principal
var svg = d3.select(".map").append("svg")
    .attr("width", width)
    .attr("height", height);

//creo la función que convertira el topojson en la proyección albers
var projection = d3.geo.equirectangular()
    .center([0, -2])
    .rotate([85, 0])
    //.parallels([0, 15])
    .scale(260)
    .translate([width / 2, height / 2]);
//variable que crea el path
var path = d3.geo.path()
    .projection(projection);
//adiciono un contenedor
var g = svg.append("g");

//genero los tooltip sobre el mapa
var DivToolTip = d3.select(".map")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("text-align", "center")
        //.style("width", "60px")
        .style("height", "20px")
        .style("padding", "2px")
        .style("font", "12px sans-serif")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("background", "#DEDCDA");

//cola para cargar archivos, asignación del map
queue()
    .defer(d3.json, "data/america.json")
    //Reproceso los datos leidos y los ingreso a un vector de objetos
    .defer(d3.tsv, "data/america.tsv", function(d) { 
      rateById.set(d.code, {"riesgo":d.riesgo,"pol":d.pol,"com":d.com,"eco":d.eco,"obs_pais":d.obs_pais,"obs_pol":d.obs_pol,"obs_com":d.obs_com,"obs_eco":d.obs_eco });
            
      return d.code;
    })
    .await(ready);


//cuando se caragan todos los archivos se llama a la función ready
function ready(error , uk) {
  var pais_json=topojson.feature(uk, uk.objects.subunits).features;
   
     
  //la variable dep contendrá los datos del topojson
  var dep=g.selectAll(".subunit")
      .data(pais_json)
  //se crean los path    
  dep.enter().append("path")
  
  //se le asigna el color al borde del mapa y se le adiciona un evento
  dep
      .attr("d", path)
      .style({'stroke':'#fff'})
      //.attr("fill", function(d,i){return color(i);})
      .attr("id", function(d) 
      {
        
        return d.properties.id+"map";
      })
      .attr("class", function(d) 
      { 
        //console.log("********************");
        //console.log(d.properties.id);
        //console.log(rateById.get(d.properties.id));
        if(typeof(rateById.get(d.properties.id))!="undefined"){
           //console.log(quantize(rateById.get(d.properties.id)[year_range_str]));
           //obtengo el porcentaje de abstencionismo del cuatrenio seleccionado para cada region y lo quantizo para encontrar el color que le corresponde
           return quantize(rateById.get(d.properties.id)["riesgo"]);

        }else{
            
            return "gray";
        } 
      })
      .on('click', function(d)
      { 
       
        //console.log(d);
        clicked(d);
        
        
        
      })
      .on('mouseover', function(d) {
          
          
          return DivToolTip.html( d.properties.name ).style("display", "inline");
      })
      .on("mousemove", function(){
          return DivToolTip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(d){
        //console.log(document.getElementById(d.properties.id).style.opacity);
       
        return DivToolTip.style("display", "none");
      });


        
 
   
};

//genera el zoom cuando se presiona click sobre alguno de los paises
function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 3;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}
