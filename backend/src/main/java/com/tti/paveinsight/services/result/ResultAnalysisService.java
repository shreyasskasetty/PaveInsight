package com.tti.paveinsight.services.result;

import com.tti.paveinsight.services.storage.StorageService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

@Service
@AllArgsConstructor
public class ResultAnalysisService {

    private StorageService storageService;

    public File retrieveShapefileFromS3(String bucketName, String fileName) throws IOException {
        // Fetch shapefile content as a string
        String shapefileContent = storageService.readFile(bucketName, fileName);

        // Save content to a local file for analysis
        File localFile = new File("temp/" + fileName); // Ensure temp directory exists
        if (!localFile.getParentFile().exists()) {
            localFile.getParentFile().mkdirs();
        }
        try (FileWriter writer = new FileWriter(localFile)) {
            writer.write(shapefileContent);
        }

        return localFile;
    }

    public void analyzeShapefile(File shapefile) {
        // Placeholder for actual analysis logic
        System.out.println("Analyzing shapefile: " + shapefile.getAbsolutePath());
    }
}
