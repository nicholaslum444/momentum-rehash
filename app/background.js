// Background feature


// Models

m.models.Background = Backbone.Model.extend({
    parse: function(response) {
        this.set({ 'filename': response.filename });
        this.set({'title':response.title});
    }
});


// Collections

m.collect.Backgrounds = Backbone.Collection.extend({
    model: m.models.Background,
    url: 'app/backgrounds.json',
    parse: function (response) {
        return response.backgrounds;
    }
});


// Views

m.views.Background = Backbone.View.extend({
    tagName: 'li',
    attributes: {  },
    // JO: Testing setting background without a template
    //template: Handlebars.compile( $("#background-template").html() ),
    initialize: function () {
        this.render();
        this.model.on('change:dayEnd', _.bind(this.loadNewBg, this));
        this.model.on('change:clickedchange', _.bind(this.loadNewBg, this));
    },
    render: function () {
        var that = this;
        var index = window.localStorage['background'] || 0;
        //console.log('index is ' + index);
        //console.log('localstorage background is ' + localStorage['background']);
        window.localStorage['background'] = index;
        var filename = this.collection.at(index).get('filename');
        var title = this.collection.at(index).get('title');
        var order = (this.options.order || 'append') + 'To';
        $('#center-above').html("");
        $("#center-above").append("<a "+ " style='" + "margin-top:10px" + "'>" + title+ "</a>")

        //console.log(title);

        // JO: Hack to get the backgrounds to fade between each other; replace with background subviews and separate LIs
        $('#background').css('background-image',$('#background').find('li').css('background-image'));

        // JO: Make sure the background image loads before displaying (even locally there can be a small delay)
        $('<img/>').attr('src', 'backgrounds/' + filename).load(function() {
            that.$el[order]('#' + that.options.region).css('background-image','url(backgrounds/' + filename + ')').css('opacity','0').fadeTo(200, 1);
            $(this).remove();
        });
    },
    loadNewBg: function () {
        console.log('loadNewBg called');
        var index = window.localStorage['background'];
        //console.log('current bg: ' + index);
        var newIndex = Math.floor(Math.random()*this.collection.models.length);
        //console.log('new bg: ' + newIndex);
        if (newIndex == index) newIndex + 1;
        if (newIndex == this.collection.models.length) newIndex = 0;
        //console.log('new bg: ' + newIndex);
        window.localStorage['background'] = newIndex;
        this.render();
    }

    
});


