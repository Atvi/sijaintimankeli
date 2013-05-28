/**
 * Client-aliohjelmat, jotka ohjaavat karttan‰kym‰n toimintaa ja viestiv‰t
 * palvelimen kanssa
 * 
 * @author Eetu Hyyryl‰inen, Matias Laitinen, Tuomas Nurmi, Atte R‰ty
 * @version 20.5.2013
 */

var map, markers, xmlDoc, click;
var omaSijaintiNimi = "Oma sijainti";
var kuvaNro = 0;
var omaKuva = '../media/mina.png';
var omaKohde = '../media/omakohde.png';
var kuvat = new Array('../media/kuva1.png', '../media/kuva2.png',
		'../media/kuva3.png', '../media/kuva4.png', '../media/kuva5.png',
		'../media/kuva6.png', '../media/kuva7.png', '../media/kuva8.png');
var kohteet = new Array('../media/kohde1.png', '../media/kohde2.png',
		'../media/kohde3.png', '../media/kohde4.png', '../media/kohde5.png',
		'../media/kohde6.png', '../media/kohde7.png', '../media/kohde8.png');
var Ryhmat = new Array(); // Lista johon tallennetaan layerit ryhmi‰ varten
var kayttajanimi = "testi"; // nick
var sijaintiMuutettu = false;
var apupopup; // auttaa poistamaan popupin omaa sijaintia muutettaessa
var napit;
var kohdeLonlat;
var omaLonlat;
var omaKommentti;
var haettu = false;

var firstGeolocation = true;
var geolocate = new OpenLayers.Control.Geolocate({
	bind : false,
	geolocationOptions : {
		enableHighAccuracy : true,
		maximumAge : 0,
		timeout : 7000
	}
});
geolocate.events.register("locationupdated", geolocate, function(e) {
	poistaVanhaSijainti();
	omaLonlat = e.position.coords;
	piirraMarker(omaLonlat.longitude + "", omaLonlat.latitude + "",
			kayttajanimi, "Nykyinen sijainti selaimen mukaan.", 3);
	haettu = true;

	if (firstGeolocation) {
		firstGeolocation = false;
		this.bind = true;
		kohdistaKartta(omaLonlat.longitude, omaLonlat.latitude); // Ei
		// v‰ltt‰m‰tt‰
		// tarpeellinen
		// lopullisessa
	} else {
		// TODO mahdollisesti siirret‰‰n kaikki ylempi iffiin ja elsess‰ ei
		// turhaan
		// p‰ivitet‰ grafiikkaa, vaan heitet‰‰n vaan servulle tietoi...
	}

});
geolocate.events.register("locationfailed", this, function() {
	writeComment("Paikannus kusi <br>");
	// OpenLayers.Console.log('Location detection failed');
});

/**
 * K‰sitell‰‰n kartan klikkaaminen
 */
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
	defaultHandlerOptions : {
		'single' : true,
		'double' : false,
		'pixelTolerance' : 0,
		'stopSingle' : false,
		'stopDouble' : false
	},

	initialize : function(options) {
		this.handlerOptions = OpenLayers.Util.extend({},
				this.defaultHandlerOptions);
		OpenLayers.Control.prototype.initialize.apply(this, arguments);
		this.handler = new OpenLayers.Handler.Click(this, {
			'click' : this.trigger
		}, this.handlerOptions);
	},

	trigger : function(e) {
		var lonlat = map.getLonLatFromPixel(e.xy).transform(
				new OpenLayers.Projection("EPSG:900913"),
				new OpenLayers.Projection("EPSG:4326"));
		// lisaaRyhma("kohde"); // testausta
		kohdeLisatty(lonlat);
	}
});

init(); // Kutsutaan heti aluksi init-funktiota

/**
 * Init-funktio, jota kutsutaan alussa
 */
function init() {
	$(function() {
		$("#lisaaRyhma").draggable();
		$("#hallitseRyhmia").draggable();
		$("#lisaaKohdeDialog").draggable();
		$("#omaSijaintiDialog").draggable();
	});

	writeComment("<b>Logi:</b><br>");

	var piilotaPanel = new OpenLayers.Control.Panel({
		displayClass : "piilotaPanel",
		autoActivate : true
	});

	var piilotaButton = new OpenLayers.Control({
		type : OpenLayers.Control.TYPE_TOGGLE,
		displayClass : "piilotaButton",
		eventListeners : {
			activate : function() {
				layerPanel.deactivate();
			},
			deactivate : function() {
				layerPanel.activate();
			}
		}
	});
	piilotaPanel.addControls([ piilotaButton ]);

	//
	var layerPanel = new OpenLayers.Control.Panel({
		displayClass : "layerPanel",
		autoActivate : true
	});

	var sijaintiButton = new OpenLayers.Control.Button({
		displayClass : "sijaintiButton",
		trigger : function() {
			paikanna();
			// omaSijainti();
		}
	});

	// Nappi kohteen lis‰‰mist‰ varten
	var kohdeButton = new OpenLayers.Control(
			{
				type : OpenLayers.Control.TYPE_TOGGLE,
				displayClass : "kohdeButton",
				eventListeners : {
					activate : function() {
						lisaaKohde();
					},
					deactivate : function() {
						click.deactivate();
						document.getElementById("map").style.border = '2px solid black';
						document.getElementById('lisaaKohdeDialog').style.visibility = 'hidden';
					}
				}
			});

	// Nappi ryhm‰n lis‰‰mist‰/liittymist‰ varten
	var ryhmaButton = new OpenLayers.Control(
			{
				type : OpenLayers.Control.TYPE_TOGGLE,
				displayClass : "ryhmaButton",
				eventListeners : {
					activate : function() {
						document.getElementById('lisaaRyhma').style.visibility = 'visible';
					},
					deactivate : function() {
						document.getElementById('lisaaRyhma').style.visibility = 'hidden';
					}
				}
			});

	// Nappi ryhmien hallintaa varten
	var hallintaButton = new OpenLayers.Control(
			{
				type : OpenLayers.Control.TYPE_TOGGLE,
				displayClass : "hallintaButton",
				eventListeners : {
					activate : function() {
						document.getElementById('hallitseRyhmia').style.visibility = 'visible';
					},
					deactivate : function() {
						document.getElementById('hallitseRyhmia').style.visibility = 'hidden';
					}
				}
			});

	// poistoButton otettu pois, koska turha
	napit = new Array(sijaintiButton, kohdeButton, ryhmaButton, hallintaButton);
	layerPanel.addControls([ sijaintiButton, kohdeButton, ryhmaButton,
			hallintaButton ]);

	map = new OpenLayers.Map({
		div : "map",
		theme : null,
		maxResolution : 38.21851413574219,
		numZoomLevels : 8,
		tileManager : new OpenLayers.TileManager(), // Parantaa zoomausta
		// mobiililaitteilla
		controls : [ new OpenLayers.Control.Navigation(), // Scrollilla
		// zoomaus
		new OpenLayers.Control.Attribution(), // OpenStreetMapsin teksti...
		// laillisesti pakko olla
		new OpenLayers.Control.ZoomPanel(), // Zoomauspaneeli
		// new OpenLayers.Control.LayerSwitcher(), // Ryhm‰n vaihto
		layerPanel, // Napit
		piilotaPanel // Nappien piilotus
		]
	});

	// Ryhm‰n vaihto, jotta otsikot saa pois tai nimetty‰ uudelleen
	MyLayerSwitcher.prototype = new OpenLayers.Control.LayerSwitcher;
	MyLayerSwitcher.prototype.constructor = MyLayerSwitcher;
	function MyLayerSwitcher(arguments) {
		OpenLayers.Control.LayerSwitcher.call(this, arguments);
	}

	MyLayerSwitcher.prototype.loadContents = function() {
		OpenLayers.Control.LayerSwitcher.prototype.loadContents.call(this);
		this.baseLbl.innerHTML = '';
		this.dataLbl.innerHTML = ''; // Jos haluaa nimeks esim ryhm‰, laita
		// t‰nne
	}
	map.addControl(MyLayerSwitcher.prototype);

	map.addLayer(new OpenLayers.Layer.OSM("pohja", "", {
		'displayInLayerSwitcher' : false
	}));

	kohdistaKartta("25.74509", "62.24451");
	lueTiedot();

	click = new OpenLayers.Control.Click();
	map.addControl(click);
	map.addControl(geolocate); // Laitetaan paikannus k‰yttˆˆn
	
	// Listataan ryhm‰t, joiden admin k‰ytt‰j‰ on
	listaaAdminRyhmat();
}

/**
 * Kohdistaa kartan haluttuun pisteeseen
 */
function kohdistaKartta(lon, lat) {
	ourpoint = new OpenLayers.LonLat(lon, lat);
	ourpoint.transform(new OpenLayers.Projection("EPSG:4326"), map
			.getProjectionObject());
	map.setCenter(ourpoint, 13); // Halutaanko automaattinen zoomi?
}

/**
 * Aktivoi mahdollisuuden klikata karttaa
 */
function lisaaKohde() {
	click.activate();
	document.getElementById("map").style.border = '2px solid red'; // korostetaan
	// painalluksen
	// odotusta
	// alert("Lis‰‰ nyt kohde klikkaamalla karttaa");
}

/**
 * Lis‰‰ kohteen kartalle ja deaktivoi mahdollisuuden klikata karttaa
 */
function kohdeLisatty(lonlat) {
	click.deactivate();

	if (!sijaintiMuutettu) {
		document.getElementById('lisaaKohdeDialog').style.visibility = 'visible';
		kohdeLonlat = lonlat;
	} else {
		piirraMarker(lonlat.lon + "", lonlat.lat + "", kayttajanimi,
				"Siirsit sijaintisi t‰nne", 3);
		sijaintiMuutettu = false;
		omaLonlat = lonlat;
	}
	document.getElementById("map").style.border = '2px solid black';
}

/**
 * Avaa dialogin, jonka avulla voi luoda uuden ryhm‰n tai liitty‰ olemassa
 * olevaan
 */
function lisaaRyhmaDialog() {
	popuplisaaRyhma = window
			.open(
					'../webui/lisaaRyhma.htm',
					'popUpWindow',
					'height=480,width=640,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes')
}

/**
 * Muuttaa merkkijonon XML-muotoon
 */
function StringtoXML(text) {

	if (window.ActiveXObject) {
		var doc = new ActiveXObject('Microsoft.XMLDOM');
		doc.async = 'false';
		doc.loadXML(text);
	} else {
		var parser = new DOMParser();
		var doc = parser.parseFromString(text, 'text/xml');
		// var parser = new DOMParser();
		// var xmlDoc = parser.parseFromString(xmlString, "application/xml");
	}
	return doc;
}

/**
 * Lis‰‰ ryhm‰n kartalle
 */
function lisaaRyhma(nimi) {
	// Jos haluttu ryhm‰n nimi on jo k‰ytˆss‰, aktivoidaan kyseinen taso
	var patt = new RegExp(nimi + "$");
	for (b = 0; b < Ryhmat.length; b++) {
		if (patt.test(Ryhmat[b].name)) {
			markers = Ryhmat[b];
			kuvaNro = b;
			return;
		}
	}

	if (nimi == omaSijaintiNimi) {
		markers = new OpenLayers.Layer.Markers("<img src=" + omaKuva
				+ " height=\"12\" width=\"14\">" + nimi);
	} else {
		kuvaNro = Ryhmat.length;
		markers = new OpenLayers.Layer.Markers("<img src="
				+ kuvat[kuvaNro % kuvat.length]
				+ " height=\"12\" width=\"14\">" + nimi);
	}
	// markers = new OpenLayers.Layer.Markers(nimi);
	Ryhmat[Ryhmat.length] = markers; // Lis‰t‰‰n ryhm‰ listaan
	map.addLayer(markers);

}

/**
 * Luetaan tiedot XML-tiedostosta ja luodaan vastaavat ryhm‰t ja markkerit
 */
function lueTiedot() {
	function escapeHtml(unsafe) {
		return unsafe.replace(/&(?!amp;)/g, "&amp;").replace(/<(?!lt;)/g,
				"&lt;").replace(/>(?!gt;)/g, "&gt;").replace(/"(?!quot;)/g,
				"&quot;").replace(/'(?!#039;)/g, "&#039;");
	}
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else // IE 5/6
	{
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	// L‰htenee palvelimella toimimaan kun laittaa:
	xhttp.open("GET", "../datansyotto/listaa/?nick=" + kayttajanimi, false); // jos
	// nick
	// on
	// jotain
	// muuta
	// kuin
	// debugdebugdebug,
	// suodattaa
	// ryhmien
	// mukaan
	// xhttp.open("GET", "../media/testidata.xml", false); //Kommentoi ylempi ja
	// ota pois kommenteista jos haluut testata paikallisella xmlilla
	xhttp.send();
	// writeComment(escapeHtml(xhttp.responseText));
	xmlDoc = StringtoXML(xhttp.responseText);

	// Lis‰t‰‰n markkerit k‰ytt‰jille
	kayttaja = xmlDoc.getElementsByTagName('kayttaja');
	// TODO turhaan arpoo mihin ryhm‰‰n kukakin kuuluu, voidaan viitata suoraan
	// ryhm‰n lapsiin eik‰ tarvii aina erikseen testata
	for (i = 0; i < kayttaja.length; i++) {
		var parse = kayttaja[i].getAttribute('koord').split(',');
		// Aktivoidaan / lis‰t‰‰n oikea layeri k‰ytt‰j‰n ryhm‰lle
		lisaaRyhma("" + kayttaja[i].parentNode.getAttribute('ryhmaNimi'));
		piirraMarker(parse[0], parse[1], kayttaja[i].getAttribute('nick')
				+ "&nbsp;&nbsp;<p class=\"aika\">"
				+ laskeAika(kayttaja[i].getAttribute('paivitetty')) + "</p>",
				kayttaja[i].getAttribute('kommentti'), 1);
	}

	var kohde = xmlDoc.getElementsByTagName('kohde');
	for (i = 0; i < kohde.length; i++) {
		var parse = kohde[i].getAttribute('koord').split(',');
		// Aktivoidaan / lis‰t‰‰n oikea layeri k‰ytt‰j‰n ryhm‰lle
		lisaaRyhma("" + kohde[i].parentNode.getAttribute('ryhmaNimi'));
		piirraMarker(parse[0], parse[1], kohde[i].getAttribute('nick'),
				kohde[i].getAttribute('kommentti'), 2);
	}

}

/**
 * Piirt‰‰ markkerin kartalle, haluttuun kohtaan halutulla popupin sis‰llˆll‰
 * kohde: 1 = ryhm‰l‰inen, 2 = kohde, 3 = k‰ytt‰j‰n oma sijainti, 4 = k‰ytt‰j‰n
 * oma kohde
 */
function piirraMarker(lon, lat, nimi, kuvaus, kohde) {
	var popup;
	var location = new OpenLayers.LonLat(lon, lat);
	var myLocation = new OpenLayers.Geometry.Point(lon, lat).transform(
			'EPSG:4326', 'EPSG:3857');

	location.transform(new OpenLayers.Projection("EPSG:4326"), map
			.getProjectionObject());
	var size = new OpenLayers.Size(21, 25);
	var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);

	// K‰ytet‰‰n eri kuvia riippuen onko kyseess‰ kohde, k‰ytt‰j‰ vai ryhm‰n
	// j‰sen
	if (kohde == 1) {
		var icon = new OpenLayers.Icon(kuvat[kuvaNro % kuvat.length], size,
				offset);
		popup = new OpenLayers.Popup.FramedCloud("Popup", myLocation
				.getBounds().getCenterLonLat(), null, nimi + '<br>' + kuvaus,
				null, true);
	} else if (kohde == 2) {
		var icon = new OpenLayers.Icon(kohteet[kuvaNro % kohteet.length], size,
				offset);
		popup = new OpenLayers.Popup.FramedCloud("Popup", myLocation
				.getBounds().getCenterLonLat(), null, nimi + '<br>' + kuvaus,
				null, true);
	} else if (kohde == 3) {
		var icon = new OpenLayers.Icon(omaKuva, size, offset);
		popup = new OpenLayers.Popup.FramedCloud(
				"Popup",
				myLocation.getBounds().getCenterLonLat(),
				null,
				nimi
						+ '<br>'
						+ kuvaus
						+ '<br><button id="lahetaOmat" onclick = omaKommentti()>L‰het‰</button>'
						+ '<button id="locate" onclick = vaihdaSijainti()>Siirr‰</button>',
				null, true);
		// placehoderi kunnes saadaan proper dialogeja
		apupopup = popup // helpottaa popupin poistamisessa
		// N‰ytet‰‰n kupla samantien:
		map.addPopup(popup);
		popup.show();
	} else if (kohde == 4) {
		var icon = new OpenLayers.Icon(omaKohde, size, offset);
		popup = new OpenLayers.Popup.FramedCloud("Popup", myLocation
				.getBounds().getCenterLonLat(), null, nimi + '<br>' + kuvaus,
				null, true);
	} else {
		writeComment("Nyt meni joku v‰‰rin... KORJAA");
		// TODO
	}

	// tehd‰‰n marker
	var marker = new OpenLayers.Marker(location, icon.clone());

	marker.events.register('mousedown', marker, function(evt) {
		map.addPopup(popup);
		popup.show();
		OpenLayers.Event.stop(evt);
	});

	markers.addMarker(marker);
	// Tooltip... Ei toimi, plus v‰‰r‰s paikkaa, plus turha?
	// marker.addFeatures([new OpenLayers.Feature.Vector(myLocation, {tooltip:
	// 'Nimi'})]);
}

/**
 * Poistetaan kaikki markerit kartasta
 */
function poistaMarkers() {
	writeComment("Ryhmia ennen poistoa: " + Ryhmat.length + "<br>");

	while (Ryhmat.length >= 1) {
		markers = Ryhmat.pop();
		map.removeLayer(markers);

	}
	kuvaNro = -1;
	writeComment("Ryhmia poiston j‰lkeen: " + Ryhmat.length + "<br>");
}

/**
 * Sallitaan k‰ytt‰j‰n antaa oma sijainti klikkaamalla karttaa
 */
function vaihdaSijainti() {
	sijaintiMuutettu = true;
	document.getElementById("map").style.border = '2px solid red'; // Korostetan
	// painalluksen
	// odotusta
	poistaVanhaSijainti();
	lisaaKohde();

}

/**
 * Poistetaan vanha sijainti kartalta
 */
function poistaVanhaSijainti() {
	if (apupopup != null) {
		map.removePopup(apupopup);
	}
	// Poistetaan kartalta vanha sijainti
	var patt = new RegExp(omaSijaintiNimi + "$");
	for (b = 0; b < Ryhmat.length; b++) {
		if (patt.test(Ryhmat[b].name)) {
			markers = Ryhmat[b];
			markers.clearMarkers(); // poistaa n‰kyvilt‰, mutta j‰tt‰‰ muistiin
			// tms.
			// markers.destroy();
			return;
		}
	}
	lisaaRyhma(omaSijaintiNimi);

}

// Vanha paikannus, j‰tin toistaseks kaiken varalta

/**
 * Jos tarkka paikannus ei onnistu, koitetaan hieman ep‰tarkempaa
 * 
 * function errorCallback_highAccuracy(position) { if (error.code ==
 * error.TIMEOUT) { navigator.geolocation.watchPosition(successCallback,
 * errorCallback_lowAccuracy, { maximumAge : 10000, timeout : 5000,
 * enableHighAccuracy : false }); } }
 * 
 * /** Jos paikannus ei onnistu, tehd‰‰n homma x (NYI)
 * 
 * function errorCallback_lowAccuracy(error) { // TODO ei saada sijaintia syyst‰
 * x // error.code == 1 => permission denied // error.code == 2 => position
 * unavailable // error.code == 3 => timeout }
 * 
 * /** Paikannuksen onnistuessa piirret‰‰n oma sijainti kartalle
 * 
 * function successCallback(position) { poistaVanhaSijainti(); omaLonlat =
 * position.coords; kohdistaKartta(omaLonlat.longitude, omaLonlat.latitude); //
 * Ei v‰ltt‰m‰tt‰ tarpeellinen lopullisessa piirraMarker(omaLonlat.longitude +
 * "", omaLonlat.latitude + "", kayttajanimi, "Nykyinen sijainti selaimen
 * mukaan.", 3); //kohdistaKartta(position.coords.longitude,
 * position.coords.latitude); // Ei v‰ltt‰m‰tt‰ tarpeellinen lopullisessa
 * //piirraMarker(position.coords.longitude + "", position.coords.latitude + "",
 * kayttajanimi, "Nykyinen sijainti selaimen mukaan.", 3); }
 * 
 * /** Haetaan oma sijainti kartalle Kannattanee k‰ynnist‰‰ karttaa luodessa, ja
 * piirt‰‰ tulokset vasta kun ne halutaan --> tarkempi sijainti GPSn
 * k‰ynnist‰miseen ja tarkan sijainnin saamiseen tuppaa kulumaan hetki TODO
 * mahollisuus kytkee pois Hieman ep‰selvyytt‰ miten toimii atm.
 * 
 * function omaSijainti() { // watchPositioni vaikuttas olevan tarkempi
 * k‰nnykk‰‰ k‰ytt‰ess‰. Pˆyt‰koneella menn‰‰n suht randomilla ja suositaan
 * manuaalista tapaa // navigator.geolocation.getCurrentPosition(...
 * navigator.geolocation.watchPosition(successCallback,
 * errorCallback_highAccuracy, { maximumAge : 10000, timeout : 5000,
 * enableHighAccuracy : true }); // maximumAge, jos on liian iso puhelin ei
 * v‰ltt‰m‰tt‰ p‰ivit‰ riitt‰v‰n usein }
 */

/**
 * Paikannus:
 */
function paikanna() {
	geolocate.deactivate();
	document.getElementById('track').checked = false;
	geolocate.watch = false;
	firstGeolocation = true;
	geolocate.activate();
}

/**
 * Jatkuva paikannus
 */
function paikannaJatkuvasti() {
	geolocate.deactivate();
	if (document.getElementById('track').checked) {
		geolocate.watch = true;
		firstGeolocation = true;
		geolocate.activate();
	}
}

/**
 * N‰ytt‰‰ formin jolla l‰hetet‰‰n k‰ytt‰j‰n omat koordinaatit ja kommentti
 * palvelimelle
 */
function omaKommentti() {
	document.getElementById('omaSijaintiDialog').style.visibility = 'visible';
}

/**
 * Muuttaa sekunneissa annetun ajan mukavampaan muotoon ja palauttaa sen
 */
function laskeAika(luku) {
	if (luku > 604800)
		return (luku / 604800).toFixed(0) + "w";
	else if (luku > 86400)
		return (luku / 86400).toFixed(0) + "d "
				+ ((luku % 86400) / 3600).toFixed(0) + "h";
	else if (luku > 3600)
		return (luku / 3600).toFixed(0) + "h "
				+ ((luku % 3600) / 60).toFixed(0) + "m";
	else if (luku > 60)
		return (luku / 60).toFixed(0) + "m " + (luku % 60) + "s";
	else
		return luku + "s";
}

/**
 * Haluttua outputtia n‰kym‰‰n, auttaa testaamista
 */
function writeComment(teksti) {
	document.getElementById('comments').innerHTML += teksti;
	return false;
}

// Formien hallintaa:
/**
 * Tyhj‰‰ kaikki annetun formin kent‰t ja piilottaa parent divin
 */
function tyhjaaKentat(formi) {
	formi.reset();
	formi.parentNode.style.visibility = 'hidden';
	// Est‰‰ nappeja j‰‰m‰st‰ pohjaan... laiska ratkasu:
	for (i = 0; i < napit.length; i++) {
		napit[i].deactivate();
	}
}

/**
 * Ker‰‰ kentist‰ ryhm‰n tiedot ja l‰hett‰‰ ne palvelimelle
 */
function lahetaRyhma(formi) {
	var ryhmaRequest = new XMLHttpRequest();
	ryhmaRequest.open("GET", "../datansyotto/lisaaryhmaan/?nick="
			+ kayttajanimi + "&salasana="
			+ document.getElementById("salasana").value + "&nimi="
			+ document.getElementById("ryhmanimi").value, false);
	ryhmaRequest.send();
	tyhjaaKentat(formi);
}

/*
 * function poistaRyhma() { // Ei taideta edes tarvita, jos toteutetaan niin,
 * ett‰ adminin poistuminen ryhm‰st‰ poistaa sen automaattisesti! }
 */

/**
 * Ker‰t‰‰ kohteen lis‰ys -kentist‰ tiedot ja l‰hetett‰‰ ne palvelimelle
 */
function lahetaKohde(formi) {
	piirraMarker(kohdeLonlat.lon, kohdeLonlat.lat, kayttajanimi, document
			.getElementById("sepustus").value, 4);
	var voimassaoloaika = $('#voimassaolo option:selected').val();
	var kohdeRequest = new XMLHttpRequest();
	kohdeRequest.open("GET", "../datansyotto/kohde/?nick=" + kayttajanimi
			+ "&kommentti=" + document.getElementById("sepustus").value
			+ "&koord=" + kohdeLonlat.lon + "," + kohdeLonlat.lat
			+ "&voimassa=" + voimassaoloaika, false);
	kohdeRequest.send();
	tyhjaaKentat(formi);
}

/**
 * L‰hett‰‰ oman sijainnin ja formista ker‰tyn kommentin palvelimelle
 */
function lahetaOmaSijainti(formi) {
	var omaKommentti = document.getElementById("omaKommentti").value;
	var omaRequest = new XMLHttpRequest();
	if (haettu) {
		omaRequest.open("GET", "../datansyotto/sijainti/?nick=" + kayttajanimi
				+ "&kommentti=" + document.getElementById("omaKommentti").value
				+ "&koord=" + omaLonlat.longitude + "," + omaLonlat.latitude, false);
		
		haettu = false;
	}
	else {
		omaRequest.open("GET", "../datansyotto/sijainti/?nick=" + kayttajanimi
				+ "&kommentti=" + document.getElementById("omaKommentti").value
				+ "&koord=" + omaLonlat.lon + "," + omaLonlat.lat, false);
	}
	
	omaRequest.send();
	formi.reset();
	formi.parentNode.style.visibility = 'hidden';
	map.removePopup(apupopup);
}

/**
 * Luetaan adminille ryhmien nimet XML-tiedostosta
 */
function listaaAdminRyhmat() {
	function escapeHtml(unsafe) {
		return unsafe.replace(/&(?!amp;)/g, "&amp;").replace(/<(?!lt;)/g,
				"&lt;").replace(/>(?!gt;)/g, "&gt;").replace(/"(?!quot;)/g,
				"&quot;").replace(/'(?!#039;)/g, "&#039;");
	}
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else // IE 5/6
	{
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	// L‰htenee palvelimella toimimaan kun laittaa:
	xhttp.open("GET", "../datansyotto/listaaadminryhmat/?nick=" + kayttajanimi, false);
	xhttp.send();
	// writeComment(escapeHtml(xhttp.responseText));
	xmlDoc = StringtoXML(xhttp.responseText);

	var ryhma = xmlDoc.getElementsByTagName('ryhma');
	for (i = 0; i < ryhma.length; i++) {
		var combo = document.getElementById("valitseryhma");
		var option = document.createElement("option");
		option.text= ryhma[i].getAttribute('ryhmaNimi');
		try {
			combo.add(option, combo.options(null));
		}
		catch (e)
		{
			combo.add(option, null);
		}
	}
}

/**
 * P‰ivitt‰‰ ryhm‰n tiedot ryhmien hallinta -formin avulla
 */
function paivitaRyhma(formi) {
	if (document.getElementById("uusisalasana").value != document
			.getElementById("vahvistasalasana").value) {
		alert("Salasanat eiv‰t vastaa toisiaan");
	} else {
		var paivitettava = $('#valitseryhma option:selected').val();
		var omaRequest = new XMLHttpRequest();
		omaRequest.open("GET", "../datansyotto/paivitaryhma/?nimi=" + paivitettava
				+ "&uusisalasana=" + document.getElementById("uusisalasana").value
				+ "&kuvaus=" + document.getElementById("kuvaus").value,
				false);
		
		omaRequest.send();
		tyhjaaKentat(formi);
	}	
}