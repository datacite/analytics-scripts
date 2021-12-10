window.addEventListener('load', function() {

  ///////////////////////////////////////
  // Set data-analytics on appropriate elements.
  // Properties can be provided as follows:
  //    json+ld (schema.org)
  //    metadata (dublin core)
  //    doi provided in the page url
  ///////////////////////////////////////

  // Scan the document for elements with data-metadata-id.
  // Try to build the data_analytics attribute for them.
  // Construct the data-analytics tag for any links or buttons with custom attribute: 'data-metadata-id'
  var element;
  var data_analytics = {"props":{"doi": ''}};
  var doi;

  //
  // GET THE DOI, add data-analytics property appropriately to
  //
  // const DOI = "https://doi.org/10.5061/dryad.0cfxpnw32"
  //
  var test_doi = "https://doi.org/10.5061/dryad.0cfxpnw32";

  doi = (
    doi_in_tracking_snippet() ||
    doi_in_schema_org_md() ||
    doi_in_dublin_core_md() ||
    doi_in_url() ||
    null
  );

  ////////////////////

  // This is where we will set the data-analytics properties.

  if (!doi) {
    console.error("Error: No DOI provided. Download tracking disabled because of missing DOI.");
  } else {
    // Add doi data-analytics properties here!
  }

  ////////////////////

  function doi_in_tracking_snippet () {
    if ((typeof DOI !== 'undefined') && DOI) {
      console.log("*****DOI IN TRACKING SNIPPET");
      console.log(DOI);
    }
    return ((typeof DOI !== 'undefined') && DOI) ? DOI : null;
  }

  function doi_in_schema_org_md() {
    var ret = null;
    var element;
    var json;
    var text;
    if ((element = document.querySelector('script[type="application/ld+json"]')) &&
        (json = JSON.parse(element.textContent)) &&
        (('@context' in json) && (json['@context'] == 'http://schema.org')) &&
        (('@id' in json) && (text = json['@id'].match(/https?:\/\/.*doi.org\/(.*$)/)))) 
    {
      ret = text[1];
      console.log("*****DOI IN SCHEMA.ORG METADATA");
      console.log(ret);
    }
    return ret;
  }

  function doi_in_dublin_core_md() {
    var ret = null;
    var element;
    var text;
    if ((element = document.querySelector('meta[name="DC.Identifier"]')) &&
        (text = element.getAttribute('content')) &&
        (text = text.match(/https?:\/\/.*doi.org\/(.*$)/)))
    {
      ret = text[1];
      console.log("*****DOI IN DUBLIN CORE METADATA");
      console.log(ret);
    }
    return ret;
  }

  function doi_in_url() {
    var ret = null;
    var text;
    if ((element = decodeURIComponent(document.URL)) &&
        (text = element.match(/https?:\/\/.*\-doi:(.*$)/)))
        // (text = element.match(/https?:\/\/.*\/doi:(.*$)/)))
    {
      ret = text[1];
      console.log("*****DOI IN URL");
      console.log(ret);
    }
    return ret;
  }

  /*
  let elements = document.querySelectorAll("a[data-metadata-schema='schema.org']");
  console.log("============>WE ARE TAGGING THESE schema.org ELEMENTS:");
  console.log(elements);
  //addSchemaAnalyticsProps(elements);

  elements = document.querySelectorAll("a[data-metadata-schema='dublin_core']");
  console.log("============>WE ARE TAGGING THESE dublin_core ELEMENTS:");
  console.log(elements);
  //addSchemaAnalyticsProps(elements);

  // Pull doi from url - example

  // Otherwise do nothing.

  elements = document.querySelectorAll('a[data-metadata-id]');
  //console.log("WE ARE TAGGING THESE ELEMENTS:");
  //console.log(elements);
  //console.log("LOOKING FOR ELEMENT #DOI!!");
  element = document.querySelector("a#doi");
  if (element) {
    data_analytics = {"props":{"doi": doi}};
    console.log(JSON.stringify(data_analytics));
    element.setAttribute('data-analytics', '"downloads1", ' + JSON.stringify(data_analytics));
    console.log("GOT ELEMENT #DOI!!!");
  } else {
    console.log("DID NOT FIND ELEMENT #DOI!!!");
  }

  //
  // Iterate Elements to build the data_analytics property.
  //
  // @param {NodeList} Array of elements
  // @param {string} callback function name
  //
  function addAnalyticsProps(elements) {
    console.log('============>CALLED addAnalyticsProps with elements.length = ', elements.length);
    for (var i = 0; i < elements.length; i++) {
        console.log('elements ' + i);
        console.log(elements[i]);

        // if schema.org metadata

        // elseif dublincore metadata

        // else try to get doi from url


    }
  }
*/

  //////////////////////////////////////////////////////////////////////////////////////////
  //  CUSTOM EVENT HANDLER CODE FROM PLAUSIBLE.IO FOR 'data-analytics' link and form events:
  //  https://plausible.io/docs/custom-event-goals
  //////////////////////////////////////////////////////////////////////////////////////////

  // Handle link events - those that have data-analytics
  elements = document.querySelectorAll("a[data-analytics]");
  registerAnalyticsEvents(elements, handleLinkEvent);
  console.log("REGISTERING LINK EVENTS!")

  // Handle button form events - those that have data-analytics
  elements = document.querySelectorAll("button[data-analytics]");
  registerAnalyticsEvents(elements, handleFormEvent);

  //
  // Iterate Elements and add event listener
  //
  // @param {NodeList} Array of elements
  // @param {string} callback function name
  //
  function registerAnalyticsEvents(elements, callback) {
      for (var i = 0; i < elements.length; i++) {
          elements[i].addEventListener('click', callback);
          elements[i].addEventListener('auxclick', callback);
          console.log('REGISTER LINK EVENT: ' + i);
      }
  }

  //
  // Handle Link Events with plausible
  // https://github.com/plausible/analytics/blob/e1bb4368460ebb3a0bb86151b143176797b686cc/tracker/src/plausible.js#L74
  //
  // @param {Event} click
  //
  function handleLinkEvent(event) {
      var link = event.target;
      var middle = event.type == "auxclick" && event.which == 2;
      var click = event.type == "click";
      while (link && (typeof link.tagName == 'undefined' || link.tagName.toLowerCase() != 'a' || !link.href)) {
          link = link.parentNode;
      }
      console.log("Handling event!");
      console.log(link);
      if (middle || click)
          registerEvent(link.getAttribute('data-analytics'));

      // Delay navigation so that Plausible is notified of the click
      if (!link.target) {
          if (!(event.ctrlKey || event.metaKey || event.shiftKey) && click) {
              setTimeout(function () {
                  location.href = link.href;
              }, 150);
              event.preventDefault();
          }
      }
  }

  //
  // Handle form button submit events with plausible
  //
  // @param {Event} click
  //
  function handleFormEvent(event) {
    event.preventDefault();

    registerEvent(event.target.getAttribute('data-analytics'));

    setTimeout(function () {
        event.target.form.submit();
    }, 150);
  }

  /**
  * Parse data and call plausible
  * Using data attribute in html eg. data-analytics='"Register", {"props":{"plan":"Starter"}}'
  *
  * @param {string} data - plausible event "Register", {"props":{"plan":"Starter"}}
  */
  function registerEvent(data) {
    // break into array
    let attributes = data.split(/,(.+)/);

    // Parse it to object
    let events = [JSON.parse(attributes[0]), JSON.parse(attributes[1] || '{}')];

    plausible(...events);
  }
})
