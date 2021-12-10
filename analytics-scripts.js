window.addEventListener('load', function() {

  ///////////////////////////////////////
  // Set data-analytics on appropriate elements for call to plausible on a download event.
  // Properties can be provided as follows:
  //    const DOI = "10.5061/dryad.0cfxpnw32"; (javascript, in document header - set before other scripts)
  //    json+ld (schema.org metadata)
  //    html meta tags (dublin core metadata)
  //    page url (could contain the doi)
  ///////////////////////////////////////

  // Scan the document for metadata.  Extract the DOI.
  // Scan the document for elements marked with the data-analytics attribute (download links or buttons).
  // Construct the data-analytics tag with the appropriate properties for any links or buttons, setting the doi property.
  // Other properties can be added if needed.

  const DOWNLOAD_EVENT = "downloads";
  const DOWNLOAD_ATTRIBUTE = "data-analytics-downloads";
  // Only set here for testing.
  // const DOI = "https://doi.org/10.5061/dryad.0cfxpnw32";

  var element;
  var elements;
  var data_analytics = {"props":{"doi": ""}};
  var doi;

  //
  // GET the DOI from any of the following sources:
  //

  doi = (
    doi_in_tracking_snippet() ||
    doi_in_schema_org_md() ||
    doi_in_dublin_core_md() ||
    doi_in_url() ||
    null
  );

  ////////////////////////////////////

  // Set the data-analytics properties.  Currently, we only handle downloads with the doi.

  if (!doi) {
    console.error("Error: No DOI provided in metadata. Download tracking disabled because of missing DOI.");
  } else {
    // Add doi data-analytics properties here!
    elements = document.querySelectorAll("a[data-analytics]");
    registerDownloadProperties(elements, doi, data_analytics);
  }

  ////////////////////////////////////

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

//
// Iterate Elements and add download event properties.
//
// @param {NodeList} Array of elements
// @param {string} callback function name
//
function registerDownloadProperties(elements, doi, data_analytics) {
  if (!(elements || doi || props)) {
    return;
  }
  for (var i = 0; i < elements.length; i++) {
      data_analytics.props.doi = doi;
      elements[i].setAttribute('data-analytics', '"' + DOWNLOAD_EVENT + '", ' + JSON.stringify(data_analytics));
      console.log('SETTING DOWNLOAD PROPERTIES FOR ELEMENT: ' + i);
      console.log('DOI IS:  ' + doi);
      console.log('PROPS ARE: ');
      console.log(data_analytics);
  }
}

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
