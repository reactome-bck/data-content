<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<h5>Locations in the PathwayBrowser</h5>
<c:if test="${fn:length(availableSpecies) gt 1}">
    <div class="padding">
        <select name="availableSpecies" id="availableSpeciesSel" style="height: 1.5em;">
            <c:forEach items="${availableSpecies}" var="species">
                <option value="${fn:replace(species, ' ', '_')}" ${species == 'Homo_sapiens' ? 'selected' : ''}>${species}</option>
            </c:forEach>
        </select>
    </div>
</c:if>

<div style="padding: 0 0 17px 15px">
    <c:forEach var="topLvl" items="${topLevelNodes}">
        <c:choose>
            <c:when test="${empty topLvl.children}">
                <i class="sprite-resize sprite sprite-Pathway"></i><a href="${topLvl.url}" class="" title="goto Reactome Pathway Browser" rel="nofollow">${topLvl.name} (${topLvl.species})</a>
            </c:when>
            <c:otherwise>
                <%--
                    The class attribute is used as a jQuery selector. This class is not present in the css.
                    Specially for chemical, it is present in all species, instead of showing a big list we just show Human as the default
                    and let the user select the desired species in a dropdown list.
                 --%>
                <div class="tplSpe_${fn:replace(topLvl.species, ' ', '_')}" style="display: none">
                    <span class="plus" title="click here to expand or collapse the tree">
                        <i class="sprite-resize-small sprite sprite-plus" title="click here to expand or collapse the tree"></i>
                    </span>
                    <span style="font-size:14px"><i class="sprite-resize sprite sprite-Pathway"></i> <a href="${topLvl.url}" class="" title="goto Reactome Pathway Browser" rel="nofollow">${topLvl.name} (${topLvl.species})</a></span>
                    <div class="treeContent">
                        <ul class="tree">
                            <c:set var="node" value="${topLvl}" scope="request"/>
                            <li> <c:import url="node.jsp"/></li>
                        </ul>
                    </div>
                </div>
            </c:otherwise>
        </c:choose>
    </c:forEach>
</div>