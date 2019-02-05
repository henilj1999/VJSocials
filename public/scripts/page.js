$('#demo').pagination({
    dataSource: 'https://newsapi.org/v2/everything?'
    +'q=sports&from=2019-01-17&to=2019-01-17&sortBy=popularity&apiKey=a4f6ef067df542f7a89754598c354849',
    locator: 'items',
    totalNumberLocator: function(response) {
        // you can return totalNumber by analyzing response content
        return Math.floor(Math.random() * (1000 - 100)) + 100;
    },
    pageSize: 20,
    ajax: {
        beforeSend: function() {
            dataContainer.html('Loading data from flickr.com ...');
        }
    },
    callback: function(data, pagination) {
        // template method of yourself
        var html = template(data);
        dataContainer.html(html);
    }
})