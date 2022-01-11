import * as Analytics from './lib/analytics-scripts';
import Plausible from 'plausible-tracker'

const { trackPageview } = Plausible({
  // Track localhost by default
  trackLocalhost: true,
})

doi = Analytics.doi_in_tracking_snippet() || Analytics.doi_in_schema_org_md() || Analytics.doi_in_dublin_core_md() || Analytics.doi_in_url() || "";

if (!doi){
  console.error("Error: No DOI found. Tracking for this page is disabled. You need to add the DOI name into your tracking snippet"); 
} else {  
  // Override it on this call and also set a custom url
  trackPageview({ props:{
    doi: doi,
    uid: DATA_DOMAIN,
  }})
}

// export default Plausible;