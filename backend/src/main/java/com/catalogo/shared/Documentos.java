package com.catalogo.shared;

public final class Documentos {

    private Documentos() {
    }

    public static String onlyDigits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }

    public static boolean isValidCpf(String cpf) {
        String digits = onlyDigits(cpf);
        if (digits == null || digits.length() != 11 || digits.chars().distinct().count() == 1) {
            return false;
        }
        int d1 = cpfDigit(digits, 9, 10);
        int d2 = cpfDigit(digits, 10, 11);
        return digits.charAt(9) - '0' == d1 && digits.charAt(10) - '0' == d2;
    }

    public static boolean isValidCnpj(String cnpj) {
        String digits = onlyDigits(cnpj);
        if (digits == null || digits.length() != 14 || digits.chars().distinct().count() == 1) {
            return false;
        }
        int[] w1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] w2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int d1 = cnpjDigit(digits, w1);
        int d2 = cnpjDigit(digits, w2);
        return digits.charAt(12) - '0' == d1 && digits.charAt(13) - '0' == d2;
    }

    private static int cpfDigit(String digits, int length, int weightStart) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += (digits.charAt(i) - '0') * (weightStart - i);
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }

    private static int cnpjDigit(String digits, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += (digits.charAt(i) - '0') * weights[i];
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }
}
