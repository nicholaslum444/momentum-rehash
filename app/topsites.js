$(document).ready( function() {
	//console.log("add");

	updateList();
	var array=['https://www.facebook.com/','http://202.141.80.14/','http://www.reddit.com/','https://webmail.iitg.ernet.in/src/login.php?secure_login=yes','http://ibnlive.in.com/','http://www.ndtv.com/','http://www.quora.com/','http://www.gmail.com/']
	function updateList(){
	
		chrome.topSites.get(function(info){
			
			var ul = document.getElementById("recentsites");
			//var li = document.createElement("li");
			//li.appendChild(document.createTextNode("Your list item text"));

			
			/*$("#recent").html("");
			$("#recent").append("<a "+ " class='" + "top-nav" + "'>" + "Recent Sites" + "</a>");
			$("#recent").append("<ul "+ " style='" + "margin-top:-15px" + "'>");
*/
		
            for(var i=0;i<15;i++) 
            {
            	
            	if($.inArray(info[i].url, array)== -1)
            		{
            			//alert(info[i].url);
            			console.log('asda');

            			var a = document.createElement('a');
						var linkText = document.createTextNode(info[i].title.substring(0,10));
						a.appendChild(linkText);
						a.title =info[i].title.substring(0,10);
						a.href =info[i].url;
						//document.body.appendChild(a);
            			li=document.createElement("li");
            			li.appendChild(a);
            			ul.appendChild(li);
            			//$("#recent").append("<li><a "+ " href='" + info[i].url + "'><strong>" + info[i].title.substring(0,10) + "</strong></a></li>");
            			//$("#recent").append("<li>");
            		}

            	//if(i==14)
            		//$("#recent").append("</ul></div>");
            }

            
        });

        //    


  
   }




// chrome.storage.sync.get( null, function (items){
// 		console.log(items);
// 		$(".lst").html("");
// 		var i=0;
// 		for (var k in items){
// 			//console.log(items[k]['title'] + 'aa');
// 			var lin; var tit;
// 			if (items[k].value.indexOf("http") == 0){
// 				lin = items[k]['value'];
// 				tit = items[k]['value'].replace(/\-/g, " ").split("://")[1].split("/")[1];
				
// 			} else {
// 				lin = "http://www.quora.com" + items[k]['value'];
// 				tit = items[k]['value'].replace(/\-/g, " ").split("/");
// 				if (tit[2].indexOf('answer')==0){
// 					tit = tit[1] + "?";
// 				} else {
// 					tit = tit[2] + "?";
// 				}
// 			}
// 			if (items[k]['title'] != '') tit = items[k]['title'];
// 			$(".lst").append("<a target='_blank' class='oplink' key='" + k + "' href='" + lin + "'><li>" + tit + "</li></a>");
// 			i++;
// 		}
// 		if (i==0) $(".lst").html("<li>Reading List is empty!</li>");
		
// 		$('.oplink').click( function() {
// 			chrome.storage.sync.remove($(this).attr("key"));
// 			//return false;
// 		});
// 	});
// 	}
	
// 	$(".clr").click(function(){
// 		chrome.storage.sync.clear();
// 		updateList();
// 	});
	
	
});
