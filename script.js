d3.text("https://raw.githubusercontent.com/dsc-courses/dsc106-sp24/gh-pages/resources/data/Internet_data.csv", function(error, rawData) {
    if (error) throw error;

    
    function parseCSV(data) {
        const rows = data.split('\n');
        const headers = rows[1].split(',').map(header => header.trim());
        headers[1] = 'Country'; 
        const result = [];

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < row.length; j++) {
                const char = row[j];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            values.push(current.trim()); 
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                result.push(obj);
            }
        }

        return result;
    }

    
    const parsedData = parseCSV(rawData);

    
    const colorScale = d3.scaleThreshold()
        .domain([10, 25, 40, 55, 70])
        .range([
            "#d4f0fc",
            "#89d6fb",
            "#02a9f7",
            "#02577a",
            "#01303f"
        ]);

    const years = [2000, 2005, 2010, 2015, 2021];

    
    const legendData = [
        { color: "#d4f0fc", label: "10-25" },
        { color: "#89d6fb", label: "25-40" },
        { color: "#02a9f7", label: "40-55" },
        { color: "#02577a", label: "55-70" },
        { color: "#01303f", label: "70+" }
    ];

    const legend = d3.select("#legend");
    legendData.forEach(d => {
        const item = legend.append("div").attr("class", "legend-item");
        item.append("div")
            .attr("class", "legend-color")
            .style("background-color", d.color);
        item.append("div").text(d.label);
    });

   
    updateLollipopPlot(2000);

    
    function updateLollipopPlot(year) {
        const filteredData = parsedData.filter(d => d['Year'] == year);

        const data = filteredData.map(d => ({ Country: d['Country'], Value: +d['Value'] }));

        data.sort((a, b) => b.Value - a.Value);

        d3.select("#my_dataviz").selectAll("svg").remove();

        const margin = { top: 10, right: 30, bottom: 40, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;

        const svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Value)])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 30)
            .text("Percentage of Population");

        const y = d3.scaleBand()
            .range([0, height])
            .domain(data.map(d => d.Country))
            .padding(1);
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(() => ""));

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2 + margin.top)
            .text("Countries");

        const lines = svg.selectAll("myline")
            .data(data);

        lines.enter()
            .append("line")
            .merge(lines)
            .transition().duration(1000)
            .attr("x1", d => x(d.Value))
            .attr("x2", x(0))
            .attr("y1", d => y(d.Country))
            .attr("y2", d => y(d.Country))
            .attr("stroke", "grey")
            .attr("class", "lollipop-line");

        lines.exit().remove();

        const circles = svg.selectAll("mycircle")
            .data(data);

        circles.enter()
            .append("circle")
            .merge(circles)
            .transition().duration(1000)
            .attr("cx", d => x(d.Value))
            .attr("cy", d => y(d.Country))
            .attr("r", "7")
            .style("fill", d => colorScale(d.Value))
            .attr("stroke", "black")
            .attr("class", "lollipop-circle");

        circles.exit().remove();

        document.getElementById('countryInput').addEventListener('input', function() {
            const country = this.value.toLowerCase();
            highlightCountry(country);
        });

        function highlightCountry(country) {
            d3.selectAll(".lollipop-line, .lollipop-circle").each(function(d) {
                const isMatch = d && d.Country && d.Country.toLowerCase() === country;
                d3.select(this).classed("highlighted", isMatch);
                if (isMatch) {
                    console.log(`Highlighted: ${d.Country}`);
                }
            });

            d3.selectAll(".highlighted")
                .attr("stroke", "yellow")
                .attr("fill", "yellow")
                .attr("r", 10)
                .attr("stroke-width", 3);

            d3.selectAll(".lollipop-line:not(.highlighted)")
                .attr("stroke", "grey")
                .attr("stroke-width", 1);

            d3.selectAll(".lollipop-circle:not(.highlighted)")
                .attr("fill", d => colorScale(d.Value))
                .attr("stroke-width", 1)
                .attr("r", 7);
        }
    }

    document.getElementById('yearSlider').addEventListener('input', function() {
        const yearIndex = this.value;
        const year = years[yearIndex];
        document.getElementById('selectedYear').textContent = year;
        updateLollipopPlot(year);
    });
});
