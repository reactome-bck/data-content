package org.reactome.server.util;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.annotation.PreDestroy;
import javax.net.ssl.*;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

/**
 * Generates the header and the footer every MINUTES defined below.
 * The header.jsp and footer.jsp are placed under jsp folder in WEB-INF
 *
 * IMPORTANT
 * ---------
 * We assume the war file runs exploded, because there is no way of writing
 * a file in a none-exploded war and the jsp template needs the templates
 * to be in the defined resources to parse the content (and this is used
 * to keep the species and other filtering options)
 *
 * @author Antonio Fabregat <fabregat@ebi.ac.uk>
 */
@Component
public class HeaderFooterCacher extends Thread {

    private static Logger logger = LoggerFactory.getLogger("threadLogger");

    private static final String TITLE_OPEN = "<title>";
    private static final String TITLE_CLOSE = "</title>";
    private static final String TITLE_REPLACE = "<title>Reactome | ${title}</title>";

    private static final String SEARCH_OPEN = "<!--SearchForm-->";
    private static final String SEARCH_CLOSE = "<!--/SearchForm-->";
    private static final String SEARCH_REPLACE = "<jsp:include page=\"search/searchForm.jsp\"/>";

    private static final String SCRIPT_FOOTER_CLOSE = "</body>";
    private static final String SCRIPT_FOOTER_REPLACE = "<script type=\"text/javascript\" src=\"/content/resources/js/data-content.js?v=3.2\"></script>\n</body>";

    private static final String MAIN_CSS = "<link rel=\"stylesheet\" href=\"/content/resources/css/main.css?v=20180710\" type=\"text/css\" />";

    private static final String HEADER_CLOSE = "</head>";
    private static final String HEADER_CLOSE_REPLACE = MAIN_CSS + "\n" + "<jsp:include page=\"graph/json-ld.jsp\"/>\n</head>";

    private static final Integer MINUTES = 15;

    // Name of the template page in Joomla
    private static final String TEMPLATE_PAGE = "template-datacontent";

    private final String server;

    private boolean active = true;

    @Autowired
    public HeaderFooterCacher(@Value("${template.server}") String server) {
        super("DC-HeaderFooter");
        this.server = server;
        start();
    }

    @Override
    public void run() {
        try {
            while (active) {
                getHeaderAndFooter(getTemplate());
                if (active) Thread.sleep(1000 * 60 * MINUTES);
            }
        } catch (InterruptedException e) {
            logger.info("Data-Content HeaderFooterCacher interrupted");
        }
    }

    private synchronized void writeFile(String fileName, String content) {
        try {
            //noinspection ConstantConditions
            String path = getClass().getClassLoader().getResource("").getPath();
            //HACK!
            if (path.contains("WEB-INF")) {
                //When executing in a deployed war file in tomcat, the WEB-INF folder is just one bellow the classes
                path += "../pages/";
            } else {
                //When executing in local we need to write the files in the actual resources
                path += "../../src/main/webapp/WEB-INF/pages/";
            }
            String file = path + fileName;
            FileOutputStream out = new FileOutputStream(file);
            out.write(content.getBytes());
            out.close();
            logger.debug(file + " updated successfully");
        } catch (IllegalStateException | NullPointerException | IOException e) {
            logger.warn("Error updating " + fileName);
            interrupt();
        }
    }

    private String getTemplate() {
        String templateURL = this.server + TEMPLATE_PAGE;
        try {
            String rtn = IOUtils.toString(getTemplateInputStream(templateURL));

            // Add search form
            rtn = getReplaced(rtn, SEARCH_OPEN, SEARCH_CLOSE, SEARCH_REPLACE);
            rtn = getReplaced(rtn, TITLE_OPEN, TITLE_CLOSE, TITLE_REPLACE);
            rtn = getReplaced(rtn, SCRIPT_FOOTER_CLOSE, SCRIPT_FOOTER_CLOSE, SCRIPT_FOOTER_REPLACE);

            // Add main.css and Json-ld for schema
            rtn = getReplaced(rtn, HEADER_CLOSE, HEADER_CLOSE, HEADER_CLOSE_REPLACE);

            rtn = rtn.replaceFirst("<base.*/>", "");
            // Avoid replacing the protocol inside script tag. Google Structured Data reports as invalid schema.
            rtn = rtn.replaceAll("(?!<script[^>]*?>)(http|https)://(?![^<]*?</script>)", "//");

            // remove joomla template default class
            rtn = rtn.replaceAll("favth-content-block", "");

            return rtn;
        } catch (IOException e) {
            logger.warn("The template file is not available. Please check '" + templateURL + "'");
            return String.format("" +
                    "<span style='color:red'>%s is not available</span>" +
                    "<!-- template-placeholder -->" +
                    "<span style='color:red'>No footer available</span>", templateURL);
        }
    }

    private void getHeaderAndFooter(String file) {
        if (file != null && !file.isEmpty()) {
            String[] parts = StringUtils.split(file, "<!-- template-placeholder -->");
            writeFile("header.jsp", parts[0]);
            writeFile("footer.jsp", parts[1]);
        }
    }

    private String getReplaced(String target, String open, String close, String replace) {
        try {
            String pre = target.substring(0, target.indexOf(open));
            String suf = target.substring(target.indexOf(close) + close.length(), target.length());
            return pre + replace + suf;
        } catch (StringIndexOutOfBoundsException e) {
            return target;
        }
    }

    private InputStream getTemplateInputStream(String url){
        try {
            HttpURLConnection conn;
            URL aux = new URL(url);
            if(aux.getProtocol().contains("https")){
                doTrustToCertificates(); //accepting the certificate by default
                conn = (HttpsURLConnection) aux.openConnection();
                conn.setInstanceFollowRedirects(true);  //you still need to handle redirect manully.
                HttpURLConnection.setFollowRedirects(true);
            }else{
                URLConnection tmpConn = aux.openConnection();
                conn = (HttpURLConnection) tmpConn;
            }
            return conn.getInputStream();
        } catch (IOException | NoSuchAlgorithmException | KeyManagementException e) {
            interrupt();
            throw new RuntimeException();
        }
    }

    // trusting all certificate
    @SuppressWarnings("Duplicates")
    private void doTrustToCertificates() throws NoSuchAlgorithmException, KeyManagementException {
        Security.addProvider(new com.sun.net.ssl.internal.ssl.Provider());
        TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return null;
                    }

                    public void checkServerTrusted(X509Certificate[] certs, String authType) throws CertificateException {}

                    public void checkClientTrusted(X509Certificate[] certs, String authType) throws CertificateException {}
                }
        };

        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, new SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        HostnameVerifier hv = (urlHostName, session) -> {
            if (!urlHostName.equalsIgnoreCase(session.getPeerHost())) {
                logger.warn("Warning: URL host '" + urlHostName + "' is different to SSLSession host '" + session.getPeerHost() + "'.");
            }
            return true;
        };
        HttpsURLConnection.setDefaultHostnameVerifier(hv);
    }

    @PreDestroy
    @Override
    public void interrupt() {
        active = false;
        super.interrupt();
        logger.info("Data-Content HeaderFooterCacher stopped");
    }
}
