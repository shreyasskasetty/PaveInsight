package com.tti.paveinsight.services.staticpage;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Service
@AllArgsConstructor
public class StaticPageGeneratorService {
    private final SpringTemplateEngine templateEngine;

    public void generateStaticMapPage(String geoJsonData, Path outputFilePath) throws IOException, JSONException {
        JSONObject parsedGeoJson = parseGeoJson(geoJsonData);
        Context context = new Context();
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> geoJsonMap = objectMapper.readValue(parsedGeoJson.toString(), new TypeReference<Map<String, Object>>() {});
        context.setVariable("geoJsonData", geoJsonMap);
        String renderedHtml = templateEngine.process("map", context);

        Files.write(outputFilePath, renderedHtml.getBytes(StandardCharsets.UTF_8));
    }
    private JSONObject parseGeoJson(String jsonString) throws JSONException{
        // Step 1: Remove the comment wrapper
        return new JSONObject(jsonString);
    }
}

