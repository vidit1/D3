/**
 * Created by vidit on 6/22/16.
 */
function D3Pie(obj)  {

  d3.selectAll(obj.divId).on('mousemove',null)
    .on('mouseout',null)
    .on('mousedown',null);

  var chart = {},
    data = obj.series,
    downloadFlag = false;

  //Setting margin and width and height
  var margin = {top: 20, right: 30, bottom: 60, left: 50},
    width = ($(obj.divId).width()==0?600:$(obj.divId).width()) - margin.left - margin.right,
    height = obj.height?obj.height:550 - margin.top - margin.bottom,
  radius = Math.min(width*0.75, height*0.75) / 2;

  var color = d3.scale.ordinal()
    .range(['#DF9930', '#1A1D1E', '#5E95E1', '#DD4949', '#49C3DD', '#7AE1AB', '#849448', '#7A5D4B', '#A971D8']);

  var legendToggleTextFlag = false;

  var arc = d3.svg.arc()
    .outerRadius(radius )
    .innerRadius(0);

  var arcOver = d3.svg.arc()
    .outerRadius(radius+10)

  var pie = d3.layout.pie()
    .value(function(d) { return d.y; });




  //calling legend and setting width,height,margin,color
  var legend;


  //Setting domain for the colors with te exceptioon of date column
  color.domain(data.map(function (d) {
    return d.label
  }));



  for(var i=0;i<data.length;i++){
    data[i].hover = false;
    data[i].disabled = true;
  }


  var cities = data,
    rawData = JSON.parse(JSON.stringify(cities)),    series;

  cities = rawData;

  //chart function to create chart
  chart.plot =function () {

    var sum = 0;

    //Empty the container before loading
    d3.selectAll(obj.divId+" > *").remove();


    //Adding chart and placing chart at specific locaion using translate
    var svg = d3.select(obj.divId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "chart")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Filtering data if the column is disable or not
    series = cities.filter(function (d) {
      if(d.disabled){
        sum += d.y;
      }
      return d.disabled;
    });

    cities.map(function (d) {
      if(d.disabled==true) {
        d.percent = ((d.y / sum) * 100).toFixed(2);
      }else{
        d.percent ="";
      }

    });

    console.log(cities);

    legend = d3Legend().height(height).width(width+margin.left+margin.right).margin(margin).color(color);

    //Appending legend box
    svg.append('g')
      .attr('class', 'legendWrap');


    //legend location
    svg.select('.legendWrap').datum(cities)
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
      .call(legend);


    if(svg.select('.legendWrap').node()&&margin.bottom<(svg.select('.legendWrap').node().getBoundingClientRect().height+30)){
      margin.bottom = svg.select('.legendWrap').node().getBoundingClientRect().height+30;
      chart.plot();
      return;
    }

    //on legend click toggle line
    legend.dispatch.on('legendClick', function (d) {
      d.disabled = !d.disabled;
      chart.plot();
    });

    //Chart Title
    svg.append('g').attr('class','titleWrap').append('text')
      .attr("x", (width / 2))
      .attr("y",  (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .text(obj.title.text);



    if(obj.downloadFlag) {
      //Download data button
      svg.append('g').attr('class', 'download')
        .classed('hidden', downloadFlag)
        .style("z-index", 1000)
        .append("rect")
        .attr('x', width)
        .attr("y", 10)
        .attr("rx", 2)
        .style("fill", "#f2f2f2")
        .style("stroke", "#666666")
        .style("stroke-width", "1px")

      d3.select(obj.divId + " > svg > g > g[class='download']").append('text')
        .attr('x', width - 10)
        .attr("y", 10)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '1.5em')
        .text('\uf0ab')
        .style("cursor", "pointer");

      d3.select(obj.divId+" > svg > g > g[class='download']").on("click",function () {
        downloadAsCsv(rawData,obj.title.text)
      });
    }

    if(obj.exporting) {

      //Graph Detail button
      svg.append('g').attr('class', 'graphDetails')
        .classed('hidden', downloadFlag)
        .style("z-index", 1000)
        .append("rect")
        .attr('x', width)
        .attr("y", 10)
        .attr("rx", 2)
        .style("fill", "#f2f2f2")
        .style("stroke", "#666666")
        .style("stroke-width", "1px")

      d3.select(obj.divId + " > svg > g > g[class='graphDetails']").append('text')
        .attr('x', width - 40)
        .attr("y", 10)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '1.5em')
        .text('\uf05a')
        .style("cursor", "pointer");


      d3.select(obj.divId + " > svg > g > g[class='graphDetails']").on("click", function () {
        obj.exporting.buttons.customButton.onclick(obj)
      });
    }
    var qkeyButton={},textLength=0
    if(obj.exporting&&obj.exporting.buttons.hasOwnProperty('qkeyButton')){
      qkeyButton = obj.exporting.buttons.qkeyButton;
      if(qkeyButton.type=="legendToggle"){
        textLength = $('<span id="D3TextTemp" style="">'+(legendToggleTextFlag==true?"Select All":"Deselect All")+'</span>').appendTo('body').width();
        $('#D3TextTemp').remove();
        svg.append('g').attr('class', 'qkeyButton')
          .style("z-index", 1000)
          .append("rect")
          .attr('x', width - 10 - textLength -20 + (qkeyButton.x?qkeyButton.x:0 ))
          .attr("y", 5)
          .attr("rx", 2)
          .attr("width",textLength + 10)
          .style("fill", "#f2f2f2")
          .style("stroke", "#666666")
          .style("stroke-width", "1px");

        d3.select(obj.divId + " > svg > g > g[class='qkeyButton']")
          .append("text")
          .attr('x', width - 10 - textLength -5 + (qkeyButton.x ? qkeyButton.x : 0) )
          .attr("y", 5)
          .attr("text-anchor", "middle")
          .style("font-size", "15px")
          .text(legendToggleTextFlag==true?"Select All":"Deselect All")
          .style('text-decoration','underline')
          .style('cursor','pointer');

        d3.select(obj.divId + " > svg > g > g[class='qkeyButton']").on('click',function () {
          cities.forEach(function (d) {
            d.disabled = legendToggleTextFlag;
          });
          legendToggleTextFlag = !legendToggleTextFlag;
          chart.plot();
        })


      }else {
        textLength = $('<span id="D3TextTemp" style="">' + qkeyButton.text + '</span>').appendTo('body').width();
        $('#D3TextTemp').remove();
        svg.append('g').attr('class', 'qkeyButton')
          .style("z-index", 1000)
          .append("rect")
          .attr('x', width - 10 - textLength - 20 + (qkeyButton.x ? qkeyButton.x : 0 ))
          .attr("y", 5)
          .attr("rx", 2)
          .attr("width", textLength + 10)
          .style("fill", "#f2f2f2")
          .style("stroke", "#666666")
          .style("stroke-width", "1px");

        d3.select(obj.divId + " > svg > g > g[class='qkeyButton']")
          .append("text")
          .attr('x', width - 10 - textLength - 5 + (qkeyButton.x ? qkeyButton.x : 0))
          .attr("y", 5)
          .attr("text-anchor", "middle")
          .style("font-size", "15px")
          .text(qkeyButton.text)
          .style('text-decoration', 'underline')
          .style('cursor', 'pointer');

        d3.select(obj.divId + " > svg > g > g[class='qkeyButton']").on('click',function () {
          qkeyButton.onclick();
        })
      }
    }

    // check if the data is present or not
    if(series.length==0 ){
      //Chart Title
      svg.append('g').attr('class','noDataWrap').append('text')
        .attr("x", (width / 2))
        .attr("y",  (height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("No data to display");
      return;
    }

    var g = svg.selectAll(".arc")
      .data(pie(series))
      .enter().append("g")
      .attr("class", "arc")
      .attr("id",function (d) {
        return d.data.label.replace(" ","")
      })
      .attr("transform","translate("+width/2+","+(height/2+margin.top)+")");

    g.append("path")
      .attr("d", arc)
      .attr("class",function (d) {
        return d.data.label
      })
      .style("fill", function(d) { return color(d.data.label); })
      .on('mousemove', function (d) {
      var cord = d3.mouse(d3.select(obj.divId).node());
      nvtooltip.cleanup();
      cord[0] = cord[0]-margin.left;
      d3.select(this)
        .transition()
        .duration(100)
        .attr("d", arcOver);
      nvtooltip.show(obj.divId,[cord[0], cord[1]], obj.tooltip.formatter(d.data,series),'n');

    })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("d", arc)
          .attr("stroke","none");
        nvtooltip.cleanup();
      });


    legend.dispatch
      .on('legendMouseover', function (d) {
        d3.select(obj.divId+"> svg > g > g[id='"+d.label.replace(" ","")+"'] > path")
          .transition()
          .duration(100)
          .attr("d", arcOver)
      })
      .on("legendMouseout", function (d) {
        d3.select(obj.divId+"> svg > g > g[id='"+d.label.replace(" ","")+"'] > path")
          .transition()
          .duration(100)
          .attr("d", arc)
      })

  };

  chart.plot();


  var initialWidth = $(obj.divId).width();
  setTimeout(function () {
    if ($(obj.divId).width() != initialWidth) {
      width = $(obj.divId).width() -margin.left - margin.right;
      chart.plot()
    }
  }, 2000);

  window.addEventListener('resize', function () {
    if(width==($(obj.divId).width() -margin.left - margin.right)) {
    }
    else {
      width = $(obj.divId).width() -margin.left - margin.right;
      chart.plot();

    }
  });



  chart.height = function (newHeight) {
    if(newHeight!=height) {
      height = newHeight;
      chart.plot();
    }
  };

  chart.margin = function (_) {
    if(_) {
      margin = _;
      chart.plot();
    }
  };
  return chart;

}
