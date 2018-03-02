

var IDB = (function(){
    const TABLE_APT_PRICES = 'apt_prices';
    var db,
    init = function(){
        if(!window.indexedDB){
            return window.alert("Your browser doesn't support a stable version of IndexedDB.")
        }

        var request = window.indexedDB.open('value-chart', 1);

        return new Promise(function(resolve, reject){
            request.onerror = function(event){
                console.log("error: ");
                reject();
            };
            request.onsuccess = function(event){
                db = request.result;
                console.log("success: " + db);
                resolve(IDB);
            };
            request.onupgradeneeded = function(event){
                db = event.target.result;
                var objectStore = db.createObjectStore(TABLE_APT_PRICES, {
                    keyPath:'url'
                });
            };
        });
    },
    create = function(table, data){
        console.log('idb add call!!');
        const request = db.transaction([table], 'readwrite')
            .objectStore(table)
            .add(data);

        request.onsuccess = function(event){
            return console.log('data added success: ', event);
        };
        request.onerror = function(event){
            return console.log('data added failure: ', event);
        };
    },
    read = function(table, key){
        const request = db.transaction([table])
            .objectStore(table)
            .get(key);
        return new Promise(function(resolve, reject){
            request.onsuccess = function(event){
                if(request.result){
                    console.log('data read success: ', event);
                    resolve(event.target.result);
                }else{
                    reject();
                }
            };
            request.onerror = function(event){
                console.log('data read failure: ', event);
                reject();
            };
        });
    },
    readAll = function(table){
        const request = db.transaction([table])
            .objectStore(table)
            .openCursor();

        return new Promise(function(resolve, reject){
            var datas = [];
            request.onsuccess = function(event){
                var cursor = event.target.result;
                if(cursor){
                    datas.push(cursor.value);
                    cursor.continue();
                }else{
                    resolve(datas);
                }
            };
            request.onerror = function(event){
                console.log('data read all failure: ', event);
                reject();
            };
        });
    },
    del = function(table, key){
        const request = db.transaction([table], 'readwrite')
            .objectStore(table)
            .delete(key);

        return new Promise(function(resolve, reject){
            request.onsuccess = function(event){
                console.log('data deleted success: ', event);
                resolve();
            };
            request.onerror = function(event){
                console.log('data deleted failure: ', event);
                reject();
            };
        });
    };

    return {
        init:init,
        create:create,
        update:create,
        read:read,
        del:del,
        readAll:readAll,
        TABLE_APT_PRICES:TABLE_APT_PRICES,
    }
})();
var ALERT = (function(){
    var init = function(){

    },
    open = function(msg, title){
        if(msg){
            $('#alert-modal .contents').html(msg);
        }
        if(title){
            $('#alert-modal .modal-title').html(title);
        }
        $('#alert-modal').modal();
    },
    close = function(){
        $('#alert-modal').modal('hide');
    };
    init();

    return{
        open:open,
        close:close,
    }
})();
var SIDEBAR = (function(){
    var LIST_CLICK = 'list_click',
        LIST_DEL_CLICK = 'list_del_click',

        COMPARE_CLICK = 'COMPARE_CLICK',

        isSelectionView = false,
        listeners = {}, init = function(){

        $('#saved-lists').on('click', 'li>a', function(e){
            if(typeof listeners[LIST_CLICK] == 'function' && !isSelectionView){
                listeners[LIST_CLICK]($(e.target).attr('data-idx'));
            }else{
                $(e.target).children('input[type="checkbox"]').prop('checked', !$(e.target).children('input[type="checkbox"]').is(':checked'));
            }
        });

        $('#saved-lists').on('click', 'li>a>input[type="checkbox"]', function(e){

            e.stopImmediatePropagation();
        });
        $('#saved-lists').on('click', 'li .tools .btn-del', function(e){
            console.log('del~~~');
            if(typeof listeners[LIST_DEL_CLICK] == 'function'){
                listeners[LIST_DEL_CLICK]($(e.target).attr('data-idx'));
            }
            e.stopImmediatePropagation();
        });
        $('.btn-compare-select').on('click', function(e){
            isSelectionView = true;
            $('.sidebar').addClass('select-view');
            e.stopImmediatePropagation();
        });
        $('.btn-compare').on('click', function(e){
            if(isSelectionView){
                console.log('compare!!!!');
                let selected = $('input[name="compare_selected"]:checked');
                console.log('cccc : ', selected);
                if(selected && selected.length > 1){
                    var selectedIndexes = [];
                    selected.each(function(idx, item){
                        selectedIndexes.push(parseInt($(item).attr('data-idx')));
                    });
                    listeners[COMPARE_CLICK](selectedIndexes);
                }else{
                    ALERT.open('아파트를 2개 이상 선택해주세요.')
                }
            }
            e.stopImmediatePropagation();
        });
        $('.btn-back').on('click', function(e){
            isSelectionView = false;
            $('.sidebar').removeClass('select-view');
            e.stopImmediatePropagation();
        });
    },
    reload = function(selectedIdx){
        return new Promise(function(resolve, reject){
            IDB.readAll(IDB.TABLE_APT_PRICES)
                .then(function(datas){
                    console.log(datas);
                    render(datas, selectedIdx);
                    resolve(datas);
                }, function(){
                    reject();
                });
        });
    },
    render = function(datas, selectedIdx){
        $('#saved-lists').html('');

        datas.forEach((item, idx) => {
            var active = selectedIdx == idx ? 'active':'';
            $(`
            <li class="saved-list ${active}">
                <a data-idx="${idx}">
                    <input type="checkbox" name="compare_selected" style="font-size:18px;" data-idx="${idx}"> 
                    ${item.name}
                </a>
                <div class="tools"><div class="btn-del" data-idx="${idx}"><i class="far fa-2x fa-trash-alt" data-idx="${idx}"></i> </div>
                </div>
            </li>    
        `).appendTo('#saved-lists')
        });
    },
    addEventListener = function(name, func){
        listeners[name] = func;
    };
    init();
    return {
        reload:reload,
        addEventListener:addEventListener,
        LIST_CLICK:LIST_CLICK,
        LIST_DEL_CLICK:LIST_DEL_CLICK,
        COMPARE_CLICK:COMPARE_CLICK,
    }
})();

(function(){
    var totalDatas, selectedIdx, priceChart, valueChart,
        comparePriceChart, compareValueChart,
        init = function(){
        $('.btn-excel').click(downloadExcel);
        $('.btn-send').click(crawlingKB);
        $('#month').val(moment().format('MM'));
        $('#month').change(changeMonth);
        $('#compare-month').change(changeCompareMonth);

        $('body').on('click', '#apt-del-modal .btn-ok', clickDelList);

        IDB.init()
            .then(function(){
                SIDEBAR.addEventListener(SIDEBAR.LIST_CLICK, clickList);
                SIDEBAR.addEventListener(SIDEBAR.LIST_DEL_CLICK, openAptDelModal);
                SIDEBAR.addEventListener(SIDEBAR.COMPARE_CLICK, compareApts);
                SIDEBAR.reload(selectedIdx)
                    .then(function(result){
                        totalDatas = result;
                        console.log('reload : ', totalDatas);
                    });
            });
    },
    clickList = function(idx){
        console.log('click~~~', idx);
        selectedIdx = idx;
        datas = IDB.readAll(IDB.TABLE_APT_PRICES)
            .then(function(datas){
                renderFromDatas(datas[idx]);
            });
    },
    openAptDelModal = function(idx){
        selectedIdx = idx;
        $('#apt-del-modal').modal();
    },
    clickDelList = function(e){
        var key = totalDatas[selectedIdx].url;
        IDB.del(IDB.TABLE_APT_PRICES, key)
            .then(function(){
                SIDEBAR.reload()
                    .then(function(result){
                        totalDatas = result;
                        $('#apt-del-modal').modal('hide');
                    });
            });
    },
    downloadExcel = function(){
        var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
        var textRange; var j=0;
        tab = document.getElementById('apt-price'); // id of table

        for(j = 0 ; j < tab.rows.length ; j++)
        {
            tab_text=tab_text+tab.rows[j].innerHTML+"</tr>";
        }

        tab_text=tab_text+"</table>";
        tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
        tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
        tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
        {
            txtArea1.document.open("txt/html","replace");
            txtArea1.document.write(tab_text);
            txtArea1.document.close();
            txtArea1.focus();
            sa=txtArea1.document.execCommand("SaveAs",true,"kbsise.xls");
        }
        else                 //other browser not tested on IE 11
            sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));

        return (sa);
    },
    crawlingKB = function(){
        $('#total-render').html('');
        $('#apt-price').css({'display':'none'});
        $('body').showLoading();
        console.log(moment());
        var markedYear = '2004',
            currentYear = moment().format('YYYY'),
            years = [], gap,
            totalCount = 0;
        while(gap = moment(currentYear).diff(moment(markedYear), 'years') > 0){
            nextYear = moment(markedYear).add(59, 'months').format('YYYYMM');
            currYear = moment().format('YYYYMM');
            years.unshift([moment(markedYear).format('YYYYMM'), moment(currYear).diff(moment(nextYear)) > 0 ? nextYear : currYear]);
            markedYear = moment(markedYear).add(60, 'months').format('YYYY');
            totalCount++;
        }
        var currentCount = 0;
        var url = $('input[name="url"]').val(), datas;
        console.log(years);
        datas = IDB.read(IDB.TABLE_APT_PRICES, url)
            .then(function(datas){
                    console.log('readed: ', datas);
                    renderFromDatas(datas);
                },
                function(){
                    start();
                });

        function start(){
            console.log('start~~');
            if(currentCount < totalCount){
                var param = years[currentCount];
                param = {
                    startYear:param[0].substr(0, 4),
                    startMonth:param[0].substr(4, 2),
                    endYear:param[1].substr(0, 4),
                    endMonth:param[1].substr(4, 2)
                };
                getData(param);
                currentCount++;
                console.log('get data start...');
            }else{
                console.log('get data end...');

                result = parseDatas();
                datas = { url:url, prices:result.prices, name:result.name };
                IDB.create(IDB.TABLE_APT_PRICES, datas);
                console.log('saved..!');
                renderFromDatas(datas);
                $('body').hideLoading();
            }
        }
        function getData(param){
            var query = '&조회시작년도='+param.startYear+'&조회시작월='+param.startMonth+'&조회종료년도='+param.endYear+'&조회종료월='+param.endMonth;
            $.ajax({
                url:url + query,
            })
                .done(function(result){
                    console.log(result);
                    $(result).appendTo('#temp-render');
                    start();
                });
        }
    },
    parseDatas = function(){
        var lists = $('.tbl_col tbody').children(), prices = [], name;

        lists.each((idx, item) => {
            let values = [];

            $(item).children().each((idx, item)=>{
                values.push(idx == 0 ? $(item).text().replace(/\,/g, '') : parseInt($(item).text().replace(/\,/g, '')));
            });
            prices.push(values);
        });

        console.log(prices);
        console.log('면적', $($('#주택형일련번호').children(':selected')[0]).text());

        name = $($('#부동산대지역코드').children(':selected')[0]).text() + ' '
        + $($('#부동산중지역코드').children(':selected')[0]).text() + ' '
        + $($('#부동산소지역코드').children(':selected')[0]).text() + ' '
        +$($('#물건식별자').children(':selected')[0]).text() + ' '
        +$($('#주택형일련번호').children(':selected')[0]).text();

        $('#temp-render').html('');

        return {
            prices:prices,
            name:name,
        };
    },
    changeMonth = function (){
        createValueChart([selectedDatas], $('#month').val(), valueChart, '#value-chart');
    },
    changeCompareMonth = function (){
        createValueChart(selectedDatas, $('#compare-month').val(), compareValueChart, '#compare-value-chart');
    },
    renderFromDatas = function(datas){
        selectedDatas = datas;
        createPriecTable(datas);
        createPriceChart([datas], priceChart, '#chart');
        /*createValueChart([datas], $('#month').val(), valueChart, '#value-chart');*/
        SIDEBAR.reload(selectedIdx)
            .then(function(result){
                totalDatas = result;
            });
        $('body').hideLoading();
    },
    createPriceChart = function(sources, chart, id){
        function makeData(item){
            for(var datas = [[], [], []], k = 0, l = 2 ; k < l ; k++){
                for(var i = item.prices.length - 1, j = 0 ; i > j ; i--){
                    datas[k][datas[k].length] = item.prices[i][k == 0 ? 2:5];
                }
            }
            for(var i = 0, j = datas[0].length ; i < j ; i++){
                datas[2][datas[2].length] = datas[0][i] - datas[1][i];
            }
            for(var labels = [], i = item.prices.length - 1, j = 0 ; i > j ; i--){
                labels[labels.length] = item.prices[i][0];
            }

            console.log('converted datas : ', datas);

            return {
                datas,
                labels,
                name:item.name
            }
        }

        function makeChart(chartDatas, chart, id){
            if(chart) chart.destroy();

            //data 만들기
            if(chartDatas.length > 1){ // 비교시
                let lengthGap;
                if(chartDatas[0].datas[0].length > chartDatas[1].datas[0].length){
                    lengthGap =  chartDatas[0].datas[0].length - chartDatas[1].datas[0].length;
                    lengthGap = new Array(lengthGap);
                    chartDatas[1].datas[0].splice(0, 0, ...lengthGap);
                    chartDatas[1].datas[1].splice(0, 0, ...lengthGap);
                    chartDatas[1].datas[2].splice(0, 0, ...lengthGap);
                }else{
                    lengthGap =  chartDatas[1].datas[0].length - chartDatas[0].datas[0].length;
                    lengthGap = new Array(lengthGap);
                    chartDatas[0].datas[0].splice(0, 0, ...lengthGap);
                    chartDatas[0].datas[1].splice(0, 0, ...lengthGap);
                    chartDatas[0].datas[2].splice(0, 0, ...lengthGap);
                }
            }

            let datasets = [], name = [];
            chartDatas.forEach((item)=>{
                var barColor = random_rgba(1);
                datasets.push({
                    label:'매-전',
                    data:item.datas[2],
                    /*backgroundColor: "rgba(107, 201, 8, 0.2)",
                    borderColor: "rgba(107, 201, 8, 1)",
                    hoverBackgroundColor: "rgba(72, 137, 2, 0.2)",
                    hoverBorderColor: "rgba(72, 137, 2, 1)",*/
                    backgroundColor: Color(barColor).clearer(0.3).rgbaString(),
                    borderColor: Color(barColor).rgbaString(),
                    hoverBackgroundColor: Color(barColor).darken(0.3).clearer(0.3).rgbaString(),
                    hoverBorderColor: Color(barColor).darken(0.3).rgbaString()
                });
                datasets.push({
                    label:'매매가',
                    data:item.datas[0],
                    type:'line',
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor:random_rgb(1)
                    /*borderColor: "rgba(255,99,132,1)",*/
                });
                datasets.push({
                    label:'전세가',
                    data:item.datas[1],
                    type:'line',
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor:random_rgb(1)
                    /*borderColor: "rgba(0, 144, 255, 1)",*/
                });

                name.push(item.name);
            });

            if(chartDatas[1]){
                var barColor = random_rgba(1), priceGap = [];
                chartDatas[0].datas[0].forEach((item, idx)=> priceGap.push(Math.abs(item - chartDatas[1].datas[0][idx])));
                datasets.push({
                    label:'두 아파트 매매가 차이',
                    data:priceGap,
                    backgroundColor: Color(barColor).clearer(0.3).rgbaString(),
                    borderColor: Color(barColor).rgbaString(),
                    hoverBackgroundColor: Color(barColor).darken(0.3).clearer(0.3).rgbaString(),
                    hoverBorderColor: Color(barColor).darken(0.3).rgbaString()
                });
            }

            console.log('name : ', name);
            let data = {
                datasets:datasets,
                labels:chartDatas[0].labels
            };

            //그리기
            var chartjs = new Chart($(id), {
                type:'bar',
                data:data,
                options:{
                    maintainAspectRatio: false,
                    title: {
                        display: true,
                        text: name.join(', ') + (chartDatas.length > 1 ? ' 비교 그래프':' 매매-전세-갭 그래프')
                    },
                    tooltips: {
                        mode: 'index',
                        callbacks: {
                            footer: function(tooltipItems, data) {
                                var gap = 0;
                                console.log('tooltip : ', tooltipItems, data);
                                /*tooltipItems.forEach(function(tooltipItem) {
                                    gap += data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                });*/
                                if(tooltipItems.length == 2){
                                    gap = data.datasets[tooltipItems[0].datasetIndex].data[tooltipItems[0].index] - data.datasets[tooltipItems[1].datasetIndex].data[tooltipItems[1].index];
                                    return 'gap: ' + gap;
                                }
                            },
                        },
                        footerFontStyle: 'normal'
                    },
                }
            });
            if(chartDatas.length > 1){
                comparePriceChart = chartjs;
            }else{
                priceChart = chartjs;
            }
        }

        makeChart(sources.map((item) => makeData(item)), chart, id);
    },

    createValueChart = function(sources, month, chart, id){
        console.log('month : ', month);

        function makeData(aptData, month){
            for(var date, datas = [], labels = [], selectedMonth = month, i = aptData.prices.length - 1, j = 0 ; i > j ; i--){

                date = aptData.prices[i][0].split('.');
                if(date[1] == selectedMonth){
                    datas[datas.length] = aptData.prices[i][3]*10000;
                    labels[labels.length] = date[0] + '.' + selectedMonth;
                }
            }

            console.log('labels :: ', labels);

            for(var values = [], i = 0, j = datas.length ; i < j ; i++){
                values[values.length] = parseFloat((datas[i]/(workerMonthlyAvgFee[i]*12)).toFixed(2));
            }


            console.log('values :: ', values);
            let sum = values.reduce((pre, curr) => curr += pre);
            let avg = parseFloat((sum / values.length).toFixed(2));
            let avgs = [];
            values.forEach(()=> avgs.push(avg));

            console.log(sum, avgs);

            return {
                values,
                avgs,
                name:aptData.name,
                labels,
            }
        }
        makeChart = function(chartDatas, chart, id){
            if(chart) chart.destroy();

            let datasets = [], names = [];

            chartDatas.forEach((item) => {
                datasets.push({
                    label:'pir',
                    data:item.values,
                    /*backgroundColor: "rgba(107, 201, 8, 0)",
                    borderColor: "rgba(107, 201, 8, 1)",*/
                    backgroundColor: "rgba(107, 201, 8, 0)",
                    borderColor: random_rgb(1),
                });
                datasets.push({
                    label:'pir평균',
                    data:item.avgs,
                    /*backgroundColor:"rgba(1,1,1,0)",
                    borderColor: "rgba(255,99,132,1)",*/
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor: random_rgb(1),
                });
                names.push(item.name);
            });
            let data = {
                datasets:datasets,
                labels:chartDatas[0].labels
            };
            var chartjs = new Chart($(id), {
                type:'line',
                data:data,
                options:{
                    maintainAspectRatio: false,
                    title: {
                        display: true,
                        text: names.join(', ') + (chartDatas.length > 1 ? ' 가치차트 비교':' 가치차트')
                    },
                    tooltips:{
                        mode: 'index',
                        footerFontStyle: 'normal'
                    }
                }
            });
            if(chartDatas.length > 1){
                compareValueChart = chartjs;
            }else{
                valueChart = chartjs;
            }
        }
        makeChart(sources.map((item) => makeData(item, month)), chart, id);
    },
    createPriecTable = function(datas){
        $('#total-render').html('');
        $('#apt-name').text(datas.name);
        datas.prices.forEach((item, idx)=> $(`<tr><th>${item[0]}</th>
                <td>${item[1]}</td>
                <td>${item[2]}</td>
                <td>${item[3]}</td>
                <td>${item[4]}</td>
                <td>${item[5]}</td>
                <td>${item[6]}</td>
                </tr>`).appendTo('#total-render')
        );
        $('#apt-price').css({'display':'table'});
    },
    compareApts = function(selectedIndexes){
        if(selectedIndexes.length > 2){
            return ALERT.open('2개까지만 선택해주세요.');
        }
        console.log('selectedIndexes : ', selectedIndexes);
        let datas = selectedDatas = selectedIndexes.map((idx)=> totalDatas[idx]);
        console.log('compare datas : ', datas);
        createPriceChart(datas, comparePriceChart, '#compare-price-chart');
        /*createValueChart(datas, $('#month').val(), compareValueChart, '#compare-value-chart');*/
        $('#compare-modal').modal();
    },
    random_rgba = function(){
        var o = Math.round, r = Math.random, s = 255;
        return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
    },
    random_rgb = function(a){
        var o = Math.round, r = Math.random, s = 255;
        return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + a + ')';
    },
    workerMonthlyAvgFee = [3112474,	3252090, 3444054, 3656201, 3900622,	3853189, 4007671, 4248619, 4492364, 4606216, 4734603, 4816665, 4884448, 5039770];

    init();
})();
