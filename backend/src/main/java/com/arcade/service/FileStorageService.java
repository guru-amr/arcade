package com.arcade.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${arcade.upload-dir}")
    private String uploadDir;

    @Value("${arcade.storage.type:local}") // local or s3
    private String storageType;

    public String storeFile(MultipartFile file) throws IOException {
        if ("s3".equals(storageType)) {
            return storeToS3(file);
        }
        return storeLocally(file);
    }

    private String storeLocally(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path target = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), target);
        return target.toString();
    }

    private String storeToS3(MultipartFile file) {
        // TODO: Implement S3 upload
        // Use AWS SDK to upload to S3 bucket
        // Return S3 URL
        throw new UnsupportedOperationException("S3 storage not yet implemented");
    }
}
