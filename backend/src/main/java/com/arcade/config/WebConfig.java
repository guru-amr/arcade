package com.arcade.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.support.MultipartFilter;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean<MultipartFilter> multipartFilterRegistration() {
        FilterRegistrationBean<MultipartFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new MultipartFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(Integer.MIN_VALUE);
        return registration;
    }
}
