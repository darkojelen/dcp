//License: The sound effect is permitted for non-commercial use under license “Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
//https://orangefreesounds.com/
import React from "react"
import CookieConsent from "react-cookie-consent";
import { QrReader } from 'zxing-qr-reader';
import { useState, useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import useSound from 'use-sound';
import { evaluate } from "certlogic-js"
import "./styling.css";
import boopSfx from './resources/beep-sound.mp3';
import { useTranslation } from "react-i18next";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { TRANSLATIONS_SI } from "./si/translations";
import { TRANSLATIONS_EN } from "./en/translations";
const base45 = require("base45-js");
const pako = require('pako');
const cbor = require('cbor');
//const fetch = require('node-fetch');
let ruleSets = {};
const initCerts = require("./resources/certInit.json");
const rulesSI = require("./resources/rules-SI.json");
const rulesNL = require("./resources/rules-NL.json");
const valueSets = require("./resources/valueSets.json");
const navLang = navigator.language
let beepFirst = true;
let scanCount = 0;
let liveRule1 = rulesSI.SI;
let nowAsStr = new Date().toISOString();
var scan = JSON.stringify({}, null, 2);
let iat = 1635333648; //mickey
let exp = 1697234400; //mickey
let activeButton = 0;
let defaultValue = "2021-12-15" //nowAsStr.substr(0, 10);
let manual = false;
let scanAuto = false;
let scanRef = true;
let countryListFirst = true;
const countryList = ["SI", "NL"];
i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				translation: TRANSLATIONS_EN
			},
			si: {
				translation: TRANSLATIONS_SI
			}
		}
	});
if (navLang === 'sl' || navLang === 'sl-SI') {
	i18n.changeLanguage("si");
} else {
	i18n.changeLanguage("en");
}
//console.log(navLang)
function formatZulu1(z) {
	var dateFormatted = z.substring(8, 10) + '.\u202F' + z.substring(5, 7) + '.\u2009' + z.substring(0, 4) + ' ' + z.substring(11, 13) + ':' + z.substring(14, 16)
	return dateFormatted;
}
function qrDecode(qr) {
	const qrBase45 = qr.replace('HC1:', '');
	const qrZipped = base45.decode(qrBase45);
	const qrUnziped = Buffer.from(pako.inflate(qrZipped))
	const message = cbor.decodeFirstSync(qrUnziped);
	const content = cbor.decodeFirstSync(message.value[2]);
	const hcert = content.get(-260);
	const exp = content.get(4);
	const iat = content.get(6);
	const hcertj = hcert.get(1);
	console.log(hcertj);
	return {
		"hcert": hcertj,
		"exp": exp,
		"iat": iat
	};
}
const Popup = () => {
	const { t } = useTranslation();
	return (
		<div className="popup">
			<CookieConsent
				disableStyles
				location="bottom"
				buttonText={t("confirm")}
				//				"Potrjujem"
				cookieName="cookie"
				overlay
				buttonClasses="large"
				overlayClasses="overlayclass"
				expires={365}
				debug={true}
			>
				<h1>{t("termsOfUse")}</h1>
				<p>{t("termsp1")}</p>
				<p>{t("termsp2")}</p>
				<p>{t("termsp3")}</p>
				<div className="logo"></div>
			</CookieConsent>
		</div>
	);
};
class Scanner extends React.Component {
	scannerScanStop() {
		if (scanRef === true) {
			scanRef = false
			this.qr_reader.stop();
		} else {
			scanRef = true
			this.qr_reader.scan();
		}
	}
	componentDidMount() {
		const canvas = document.getElementById('canvas');//get canvas
		const context = canvas.getContext('2d');//get canvas context
		this.qr_reader = new QrReader(context);//instantiate qr reader
		this.qr_reader.scan();//start scan
		this.qr_reader.on('found', (result) => {
			var scanJsonAll = qrDecode(result.text);
			var scanJson = scanJsonAll.hcert;
			var scanExp = scanJsonAll.exp;
			var scanIat = scanJsonAll.iat;
			iat = scanIat;
			exp = scanExp;
			scanAuto = true;
			scan = JSON.stringify(scanJson, null, 2);
			this.props.parentCallbackForeName(scanJson.nam.gn)
			this.props.parentCallbackSurName(scanJson.nam.fn)
			this.props.parentCallbackYear(scanJson.dob.substring(0, 4))
			this.props.parentCallbackScan(true)
			this.props.parentCallbackResult(false)
			this.props.parentCallback(scan)
			this.props.parentCallbackSetBShowDataVis(true)
			scanCount = scanCount + 1;
			this.props.parentCallScanCount(scanCount)
			scanRef = false
			this.qr_reader.stop();
		});
	}
	componentWillUnmount() {
		this.qr_reader.stop();
	}
	render() {
		return (
			<div>
				<canvas id="canvas" width={640} height={640}></canvas>
			</div>
		);
	}
}
const pretty = (json) => JSON.stringify(json, null, 2)
const prettyTime = (json) => {
	iat = json.iat; //mickey
	exp = json.exp; //mickey
	return JSON.stringify(json.hcert, null, 2)
}
const tryParse = (text) => {
	try {
		return JSON.parse(text)
	} catch (e) {
		return e
	}
}
const evaluateSafe = (expr, data) => {
	try {
		return evaluate(expr, data)
	} catch (e) {
		return `Error occurred during evaluation: ${e.message}.`
	}
}
var initCert = prettyTime(initCerts.initCert);
const ReactiveTextAreaNow = ({ id, value, setter1 }) =>
	<textarea
		id={id}
		onChange={(event) => {
			nowAsStr = event.target.value
			//console.log(event.target.value)
			setter1(event.target.value)
		}}
		value={value} />
const ReactiveTextArea = ({ id, value, setter }) =>
	<textarea
		id={id}
		onChange={(event) => {
			//console.log(event.target.value)
			setter(event.target.value)
		}}
		value={value} />
const mapValues = (map, mapper) => Object.fromEntries(
	Object.entries(map)
		.map(([key, value]) => [key, mapper(key, value)])
)
const computeResults = (payload, externals) => {
	if (liveRule1 !== undefined) {
		//console.log(liveRule1)
		ruleSets = {
			...ruleSets,
			"SI": liveRule1
		}
	}
	const external = {
		valueSets,
		...externals
	}
	return mapValues(ruleSets, (_, ruleSet) => {
		const perRule = mapValues(ruleSet, (_, rule) => evaluateSafe(rule.Logic, { payload, external }))
		return {
			perRule,
			allSatisfied: Object.values(perRule).reduce((acc, cur) => acc && !(cur instanceof Error) && cur, true)
		}
	})
}
const App = () => {
	const { t } = useTranslation();
	const [country, setCountry] = useState("SI");
	const [book1, updateBook1] = useState(' ');
	const [isCameraInactive, setCameraInactive] = useState(false);
	const [timedate, setTimedate] = useState(defaultValue);
	const [isCertVisible, setCertVisible] = useState(false);
	const [isSetupVisible, setSetupVisible] = useState(false);
	const [isBShowDataVis, setBShowDataVis] = useState(false);
	const child = useRef()
	const handleOnClick = () => {
		if (child.current) {
			child.current.scannerScanStop()
		}
	}
	//const [isScanCertVisible, setScanCertVisible] = useState(false);
	const [isManualInactive, setManualInactive] = useState(true);
	const [isResultInactive, setResultInactive] = useState(true);
	//const [isManualResultInactive, setManualResultInactive] = useState(true);
	const [isManualResultGreen, setManualResultGreen] = useState(true);
	const [manualResultType, setManualResultType] = useState("");
	const [manualResultState, setManualResultState] = useState("");
	const [manualResultDate, setManualResultDate] = useState("");
	const [manualResultStatusDatuma, setManualResultStatusDatuma] = useState(t("validUntil"));
	const [vtEvent, setVtEvent] = useState(t("selectVaccinationDate"))
	const [foreName, setForeName] = useState("");
	const [scanCounter, setScanCounter] = useState(0);
	const [surName, setSurName] = useState("");
	const [year, setYear] = useState("");
	const [play] = useSound(boopSfx, { volume: 0.01 });
	const [inputDateMin, setInputDateMin] = useState('2021-06-04')
	const [inputDateMax, setInputDateMax] = useState('2023-06-04')
	useEffect(() => {
		if (beepFirst === true) {
			beepFirst = false
		} else {
			play()
		}
	}, [scanCounter]);
	useEffect(() => {
		if (countryListFirst === true) {
			countryListFirst = false
		} else {
			if (country === 'SI') {
				liveRule1 = rulesSI.SI;
			} else {
				liveRule1 = rulesNL.NL;
			}
			activeButton = 0;
			setDccAsText(prettyTimeB(initCerts.cepljen33))
			myLoop();
		}
	}, [country]);
	const [dccAsText, setDccAsText] = useState(initCert)
	const [idSelectedRule, selectRule] = useState(null)
	const dcc = tryParse(dccAsText)
	const dccIsJson = !(dcc instanceof Error)
	//    const nowAsStr = new Date().toISOString()
	const [textNowAsStr, setTextNowAsStr] = useState(nowAsStr)
	useEffect(() => {
		if (manual === true) {
			myLoop();
			//console.log("manual->dccAsText")
		}
		if (scanAuto === true) {
			scanAuto = false;
			myLoop();
			//console.log("scanAuto->year")
		}
	}, [dccAsText]);
	const prettyTimeB = (json) => {
		iat = json.iat;
		exp = json.exp;
		if (typeof json.hcert.v != "undefined") {
			setTimedate(json.hcert.v[0].dt)
		}
		if (typeof json.hcert.r != "undefined") {
			setTimedate(json.hcert.r[0].fr)
		}
		if (typeof json.hcert.t != "undefined") {
			setTimedate(json.hcert.t[0].sc.substring(0, 10))
		}
		return JSON.stringify(json.hcert, null, 2)
	}
	useEffect(() => {
		updateBook1('')
	}, [textNowAsStr]);
	const results = dccIsJson ? computeResults(dcc, { validationClock: nowAsStr }) : {}
	const ruleSetIdSelectedRule = idSelectedRule === null ? null : idSelectedRule.substring(3, 5)
	const selectedRule = idSelectedRule === null ? null : ruleSets[ruleSetIdSelectedRule][idSelectedRule]
	function parseISOString(s) {
		if (s.indexOf('T') === -1) {
			s = s + "T00:00:00Z";
		}
		var b = s.split(/\D+/);
		return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
	}
	function myLoop() {
		let nowState = computeResults(dcc, { validationClock: nowAsStr }).SI.allSatisfied
		//console.log(nowAsStr + " | " + computeResults(dcc, { validationClock: nowAsStr }).SI.allSatisfied + " SEDAJ")
		setManualResultGreen(nowState)
		let uraEventTimestamp;  //kdaj je bil dogodek cepljenja ali testiranja
		let uraIatTimestamp = iat * 1000;  //iat, kdaj je bil začetek veljavnosti certifikata
		let uraExpTimestamp = exp * 1000;  //exp, do kdaj certifikat velja
		let timelineZacetek
		let prebolelost = 0;  // 0 ni prebolelost, 1 = false, 2 = true
		if (typeof dcc.r != "undefined") {
			//console.log("Datum testiranja fr: " + dcc.r[0].fr)
			uraEventTimestamp = parseISOString(dcc.r[0].fr).getTime();
			setManualResultType(t("recovery"))
			if (nowState === true) {
				prebolelost = 1;
			} else {
				prebolelost = 2;
			}
		}
		let cepljenje = true //cepljenje je OK
		let hag = false //za hag+
		if (typeof dcc.v != "undefined") {
			//console.log("Datum cepljenja dt: " + dcc.v[0].dt)
			uraEventTimestamp = parseISOString(dcc.v[0].dt).getTime();
			setManualResultType(t("vaccination") + dcc.v[0].dn + "/" + dcc.v[0].sd)
			if (dcc.v[0].dn === 1 && dcc.v[0].sd === 2) {
				cepljenje = false
			}
			setVtEvent(t("selectVaccinationDate"))
		} else {
			setVtEvent(t("selectTestDate"))
		}
		if (typeof dcc.t != "undefined") {
			//console.log("Datum testiranja sc: " + dcc.t[0].sc)
			uraEventTimestamp = parseISOString(dcc.t[0].sc).getTime();
			if (dcc.t[0].tt === "LP6464-4") {
				setManualResultType(t("testNAA"))
			} else {
				setManualResultType(t("testRAT"))
				hag = true
			}
		}
		let ostanek = (uraIatTimestamp % uraEventTimestamp) % 86400000  //to je število preko polnoči in razlika med 0 in dejanskim dogodkom
		if (ostanek !== 0) {
			timelineZacetek = uraIatTimestamp - ostanek     //vrne za en dan nazaj in sinhronizira s timestamp dogodka
		} else {
			timelineZacetek = uraIatTimestamp
		}
		let rez = null
		var dateI;  //DODANA ENA MILISEKUNDA, DA JAVI NASLEDNJI TRENUTEK		
		var rezultat;
		function formatZulu(z) {
			var dateFormatted = z.substring(8, 10) + '.\u202F' + z.substring(5, 7) + '.\u2009' + z.substring(0, 4) + ' ' + z.substring(11, 13) + ':' + z.substring(14, 16)
			return dateFormatted;
		}
		for (let i = timelineZacetek; i < uraExpTimestamp; i = i + (60 * 60 * 24 * 1000)) {
			dateI = new Date(i + 1);  //DODANA ENA MILISEKUNDA, DA JAVI NASLEDNJI TRENUTEK		
			rezultat = computeResults(dcc, { validationClock: dateI.toISOString() }).SI.allSatisfied;
			if (nowState === false) {
				if (rez === true && rezultat === false) {
					setManualResultDate(formatZulu(dateI.toISOString()))
				}
			}
			if (nowState === true) {
				if (rez === true && rezultat === false) {
					setManualResultDate(formatZulu(dateI.toISOString()))
				}
			} else {
				if (rez === false && rezultat === true) {
					setManualResultDate(formatZulu(dateI.toISOString()))
				}
			}
			if (rez !== rezultat) {
				/*if (rez === null) {
					console.log(dateI.toISOString() + " | " + rezultat + " PRVI")
				} else {
					console.log(dateI.toISOString() + " | " + rezultat + " NASLEDNJI")
				}*/
				//iLast = i
				//dateIPrint = dateI;
				rez = rezultat;
			}
		}
		rezultat = computeResults(dcc, { validationClock: dateI.toISOString() }).SI.allSatisfied;
		//console.log(dateI.toISOString() + " | " + rezultat + " zadnji")
		if (rezultat === true) {
			setManualResultDate(formatZulu(dateI.toISOString()))
		}
		if (nowState === true) {
			if (hag === true) {
				setManualResultState(t("validOnlyInSlovenia"))
			} else {
				setManualResultState(t("valid"))
			}
			setManualResultStatusDatuma(t("validUntil"))
		} else {
			setManualResultState(t("invalid"))
			if (cepljenje === true || prebolelost === 2) {
				setManualResultStatusDatuma(t("expired"))
			} else {
				setManualResultStatusDatuma("\u202F")
				setManualResultDate(t("vaccinationIsNotCmplete"))
			}
		}
	}
	return <main>
		<div id="head_top">
		</div>
		<div
			id="user_scaner"
			className={isCameraInactive ? 'skrit full-page' : 'full-page'} >
			<Scanner
				ref={child}
				parentCallbackScan={setCameraInactive}
				parentCallbackResult={setResultInactive}
				parentCallback={setDccAsText}
				parentCallbackForeName={setForeName}
				parentCallScanCount={setScanCounter}
				parentCallbackSurName={setSurName}
				parentCallbackYear={setYear}
				parentCallbackSetBShowDataVis={setBShowDataVis}
			/>
			<br />
			<h2>{t("scanQRcode")}</h2>
		</div>
		<div className={isCameraInactive ? 'skrit select center' : 'select center'} >
			<button
				className="large"
				onClick={() => {
					handleOnClick()
					manual = true
					setBShowDataVis(true)
					setCameraInactive(true)
					setResultInactive(true)
					setManualInactive(false)
					//setManualResultInactive(false)
					activeButton = 0
					setDccAsText(prettyTime(initCerts.cepljen33))
					myLoop()
				}}
			><span className="manual_ikona"></span>{t("manualEntry")}</button>
		</div>
		<div id="scaner_result"
			className={isResultInactive ? 'skrit full-page' : 'full-page'}>
			<div className="full-small"
				style={isManualResultGreen ? { backgroundColor: 'var(--green)' } : { backgroundColor: 'var(--red)' }}	>
				<div>
					<h2>{manualResultType}</h2>
					<h1>{manualResultState}</h1>
				</div>
				<div >
					<h2>{manualResultStatusDatuma}</h2>
					<h1>{manualResultDate}</h1>
				</div>
				<div className="name">
					{t("firstName")}
					<h1 id="myNamae2">{foreName}</h1>
				</div>
				<div className="name">
					{t("lastName")}
					<h1 id="myNamae">{surName}</h1>
				</div>
				<div className="name">
					{t("yearBorn")}
					<h1 id="myNamae3">{year}</h1>
				</div>
			</div>
		</div>
		<div className={isResultInactive ? 'skrit select' : 'select'}>
			<button
				className="large"
				onClick={() => {
					handleOnClick()
					manual = false
					setCameraInactive(false)
					setResultInactive(true)
					setManualInactive(true)
					//setManualResultInactive(true)
					setCertVisible(false)
				}}
			><span className="qr_ikona"></span>{t("scanQRcode")}</button>
		</div>
		<div className={isResultInactive ? 'skrit select' : 'select'}>
			<button
				className="large"
				onClick={() => {
					manual = true
					setCameraInactive(true)
					setResultInactive(true)
					setManualInactive(false)
					//setManualResultInactive(false)
					activeButton = 0
					setDccAsText(prettyTime(initCerts.cepljen33))
					myLoop()
				}}
			><span className="manual_ikona"></span>{t("manualEntry")}</button>
		</div>
		<div key="k2">{book1}</div>
		<div id="user_buttons"
			className={isManualInactive ? 'skrit full-page' : 'full-page'} >
			<div
				className="full-small"
				style={isManualResultGreen ? { backgroundColor: 'var(--green)' } : { backgroundColor: 'var(--red)' }}	>
				<div>
					<h2>{manualResultType}</h2>
					<h1>{manualResultState}</h1>
				</div>
				<div >
					<h2>{manualResultStatusDatuma}</h2>
					<h1>{manualResultDate}</h1>
				</div>
			</div>
			<fieldset className="frame">
				<legend>{t("selectTypeOfDCC")}</legend>
				<button className={activeButton === 0 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 0; setDccAsText(prettyTimeB(initCerts.cepljen33)) }}><span className="icon vakcina" ></span>3/3</button>
				<button className={activeButton === 1 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 1; setDccAsText(prettyTimeB(initCerts.cepljen21)) }}><span className="icon vakcina" ></span> 2/1</button>
				<button className={activeButton === 2 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 2; setDccAsText(prettyTimeB(initCerts.cepljen11)) }}><span className="icon vakcina" ></span> 1/1</button>
				<button className={activeButton === 3 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 3; setDccAsText(prettyTimeB(initCerts.cepljen22)) }}><span className="icon vakcina" ></span> 2/2</button>
				<button className={activeButton === 4 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 4; setDccAsText(prettyTimeB(initCerts.cepljen12)) }}><span className="icon vakcina" ></span> 1/2</button>
				<button className={activeButton === 5 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 5; setDccAsText(prettyTimeB(initCerts.prebolel)) }}><span className="icon recover" ></span>{t("recovery")}</button>
				<button className={activeButton === 6 ? 'with-icon active ' + country : 'with-icon ' + country} onClick={() => { activeButton = 6; setDccAsText(prettyTimeB(initCerts.testHAGPositive)) }}><span className="icon test" ></span>SI-HAG</button>
				<button className={activeButton === 7 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 7; setDccAsText(prettyTimeB(initCerts.testHag)) }}><span className="icon test" ></span>{t("RAT")}</button>
				<button className={activeButton === 8 ? 'with-icon active' : 'with-icon'} onClick={() => { activeButton = 8; setDccAsText(prettyTimeB(initCerts.testPCR)) }}><span className="icon test" ></span>{t("NAA")}</button>
			</fieldset >
			<fieldset className="frame">
				<legend>{vtEvent}</legend>
				<input
					min={inputDateMin} //'2021-06-04'
					max={inputDateMax} //'2023-06-04'
					type="date"
					onChange={(event) => {
						let newInputDate = new Date(event.target.value).getTime() / 1000   //nov Iat iz novega datuma
						if (newInputDate < iat) {
							iat = new Date("2021-06-04").getTime() / 1000
						}
						//console.log(event.target.value)
						setTimedate(event.target.value)
						if (typeof dcc.v != "undefined") {
							dcc.v[0].dt = event.target.value;
						}
						if (typeof dcc.r != "undefined") {
							dcc.r[0].fr = event.target.value;
							let newDfs = new Date((new Date(event.target.value).getTime()) + (11 * 86400000)).toISOString().substr(0, 10);  //11 dni po testiranju
							let newDus = new Date((new Date(event.target.value).getTime()) + (180 * 86400000)).toISOString().substr(0, 10); //180 dni po testiranju
							dcc.r[0].fs = newDfs;
							dcc.r[0].du = newDus;
						}
						if (typeof dcc.t != "undefined") {
							dcc.t[0].sc = event.target.value + 'T00:00:00Z';
						}
						setDccAsText(pretty(dcc))
						myLoop()
						//}						
					}}
					value={timedate}
				/>
			</fieldset>
		</div>
		<div className={isManualInactive ? 'skrit select' : 'select'} >
			<button
				className="large"
				onClick={() => {
					handleOnClick()
					manual = false
					setBShowDataVis(false)
					setCameraInactive(false)
					setResultInactive(true)
					setManualInactive(true)
					//setManualResultInactive(true)
					setCertVisible(false)
				}}
			><span className="qr_ikona"></span>{t("scanQRcode")}</button>
		</div>
		<div id="vsebina" className={isCertVisible ? '' : 'skrit'} >
			<fieldset className="frame">
				<legend>{t("relevantDates")}</legend>
				<ul>
					<li className="alternate"><span>{t("dccIsValidFrom")}:</span> {formatZulu1(new Date(iat * 1000).toISOString())}</li>
					<li><span>{t("dccIsValidUntil")}:</span> {formatZulu1(new Date(exp * 1000).toISOString())}</li>
					<li className="alternate"><span>{t("dateAndTime")}:</span> {formatZulu1(textNowAsStr)}</li>
					{(typeof dcc.v != "undefined") ? <li><span>{t("vaccinationDate")}:</span> {formatZulu1(dcc.v[0].dt + "T00:00")}</li> : ''}
					{(typeof dcc.r != "undefined") ? <li><span>{t("testDate")}:</span> {formatZulu1(dcc.r[0].fr + "T00:00")}</li> : ''}
					{(typeof dcc.r != "undefined") ? <li className="alternate"><span>{t("validFrom")}:</span> {formatZulu1(dcc.r[0].df + "T00:00")}</li> : ''}
					{(typeof dcc.r != "undefined") ? <li><span>{t("validUntil")}:</span> {formatZulu1(dcc.r[0].du + "T00:00")}</li> : ''}
					{(typeof dcc.t != "undefined") ? <li><span>{t("testDate")}:</span> {formatZulu1(dcc.t[0].sc)}</li> : ''}
				</ul>
			</fieldset>
			<span className="label">{t("certificateContent")}</span>
			<ReactiveTextArea id="dcc" value={dccAsText} setter={setDccAsText} />
			<div className="separate-top">
				<ReactiveTextAreaNow className="now" id="dcc_now" value={textNowAsStr} setter1={setTextNowAsStr} />
			</div>
		</div>
		<div className={isBShowDataVis ? 'data' : 'data skrit'}>
			<button
				className="large"
				onClick={() => setCertVisible(!isCertVisible)}
			>{isCertVisible ? t("hideData") : t("showData")}</button>
		</div>
		<div className="before-logo"></div>
		<div id="large_screen">
			<div className="logo"></div>
		</div>
		<div className="top-page">
			<div className="setup_icon"
				onClick={() => {
					setSetupVisible(true)
				}}>
			</div>
		</div>
		<div id="setup" className={isSetupVisible ? '' : 'skrit'}>
			<div className="large"
				onClick={() => {
					setSetupVisible(false)
				}}>
				<span className="back_ikona"></span>{t("setup")}
			</div>
			<p>{t("selectRules")}:&nbsp;
				<select
					value={country}
					onChange={e => {
						setCountry(countryList[e.target.selectedIndex])
					}
					}
				>
					{countryList.map(f => (
						<option key={f} value={f}>&nbsp;{f}&nbsp;</option>
					))}
				</select>
			</p>
		</div>
		<Popup />
	</main>
}
const Rule = ({ rule, result }) =>
	<div id="rule" className="separate-top">
		<span className="label">Rule</span>
		<div className="table" id="rule1">
			<div className="table-body">
				<div className="row header">
					<div className="cell identifier"><span>Field</span></div>
					<div className="cell"><span>Value</span></div>
				</div>
				<div className="row">
					<div className="cell"><span>Identifier</span></div>
					<div className="cell">{rule.Identifier}</div>
				</div>
				<div className="row">
					<div className="cell"><span>Type</span></div>
					<div className="cell">{rule.Type}</div>
				</div>
				<div className="row">
					<div className="cell"><span>Country</span></div>
					<div className="cell">{rule.Country}</div>
				</div>
				<div className="row">
					<div className="cell"><span>Version</span></div>
					<div className="cell">{rule.Version}</div>
				</div>
				<div className="row">
					<div className="cell"><span>SchemaVersion</span></div>
					<div className="cell">{rule.SchemaVersion}</div>
				</div>
				<div className="row">
					<div className="cell"><span>Engine</span></div>
					<div className="cell">{rule.Engine}</div>
				</div>
				<div className="row">
					<div className="cell"><span>EngineVersion</span></div>
					<div className="cell">{rule.EngineVersion}</div>
				</div>
				<div className="row">
					<div className="cell"><span>CertificateType</span></div>
					<div className="cell">{rule.CertificateType}</div>
				</div>
				<div className="row">
					<div className="cell"><span>Description</span></div>
					<div className="cell">{rule.Description.map(({ lang, desc }) => <span
						className="description">[{lang}:] {desc}</span>)}
					</div>
				</div>
				<div className="row">
					<div className="cell"><span>ValidFrom</span></div>
					<div className="cell">{rule.ValidFrom}</div>
				</div>
				<div className="row">
					<div className="cell"><span>ValidTo</span></div>
					<div className="cell">{rule.ValidTo}</div>
				</div>
				<div className="row">
					<div className="cell"><span>AffectedFields</span></div>
					<div className="cell">
						<pre>{rule.AffectedFields.join(", ")}</pre>
					</div>
				</div>
				<div className="row">
					<div className="cell"><span>Logic</span></div>
					<div className="cell">
						<pre className="logic">{JSON.stringify(rule.Logic, null, 2)}</pre>
					</div>
				</div>
				<div className="row">
					<div className="cell"><span>Result</span></div>
					<div className="cell">
						{result instanceof Error
							? <span className="orange">{result.message}</span>
							: <span className={result === true ? "green" : "red"}>{"" + result}</span>
						}
					</div>
				</div>
			</div>
		</div>
	</div>
ReactDOM.render(<I18nextProvider><App /></I18nextProvider >, document.getElementById('root'))
